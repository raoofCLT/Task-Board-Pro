import Task from '../models/Task.js';
import Sprint from '../models/Sprint.js';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import { logActivity } from './activityLogService.js';
import { emitWorkspaceEvent } from '../sockets/socketHandler.js';

// Transition matrix per spec section 3
export const ALLOWED_TRANSITIONS = {
  todo: { in_progress: ['employee'] },
  in_progress: { review: ['employee'] },
  review: { done: ['manager'], in_progress: ['manager'] }
};

export const MAX_ACTIVE_TASKS = 8;

/**
 * Counts active tasks for a user (status: todo, in_progress, review)
 */
export const countActiveTasksForUser = async (userId, excludeTaskId = null) => {
  const query = {
    assignedTo: userId,
    status: { $in: ['todo', 'in_progress', 'review'] }
  };

  if (excludeTaskId) {
    query._id = { $ne: excludeTaskId };
  }

  return await Task.countDocuments(query);
};

/**
 * Creates a new task with validation and active task limit check
 */
export const createTaskService = async ({
  title,
  description = '',
  priority = 'medium',
  dueDate,
  assignedTo = null,
  sprintId,
  workspaceId,
  labels = [],
  user
}) => {
  const sprint = await Sprint.findById(sprintId);
  if (!sprint) {
    throw new Error('Sprint not found');
  }

  const workspace = await Workspace.findById(workspaceId || sprint.workspaceId);
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  if (workspace.isArchived) {
    throw new Error(`Workspace '${workspace.name}' is archived. Cannot create tasks.`);
  }

  let assignedUserObj = null;

  if (assignedTo) {
    assignedUserObj = await User.findById(assignedTo);
    if (!assignedUserObj || assignedUserObj.isDeleted) {
      throw new Error('Assigned user not found or deactivated');
    }

    const isMember = workspace.members.some(m => m.toString() === assignedTo.toString());
    if (!isMember) {
      throw new Error(`User '${assignedUserObj.name}' is not a member of this workspace`);
    }

    const activeCount = await countActiveTasksForUser(assignedTo);
    if (activeCount >= MAX_ACTIVE_TASKS) {
      throw new Error(`User '${assignedUserObj.name}' already has ${activeCount} active tasks (Maximum allowed: ${MAX_ACTIVE_TASKS})`);
    }
  }

  const task = await Task.create({
    title,
    description,
    priority,
    status: 'todo',
    dueDate,
    assignedTo: assignedTo || null,
    sprintId: sprint._id,
    workspaceId: workspace._id,
    labels,
    createdBy: user._id,
    lastAssignedUserSnapshot: assignedUserObj
      ? { userId: assignedUserObj._id, name: assignedUserObj.name, email: assignedUserObj.email }
      : undefined
  });

  await logActivity({
    workspaceId: workspace._id,
    entityType: 'task',
    entityId: task._id,
    action: 'created',
    performedBy: user,
    message: `Task '${task.title}' created in sprint '${sprint.name}' by ${user.name}`,
    meta: { priority, assignedTo: assignedUserObj ? assignedUserObj.name : 'Unassigned' }
  });

  // Real-time socket notification
  emitWorkspaceEvent(workspace._id, 'task:created', { task });

  return task;
};

/**
 * Assigns or reassigns a task to a user
 */
export const assignTaskService = async ({ taskId, assignedToUserId, user }) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  const workspace = await Workspace.findById(task.workspaceId);
  if (workspace && workspace.isArchived) {
    throw new Error(`Workspace '${workspace.name}' is archived. Cannot assign tasks.`);
  }

  if (!assignedToUserId) {
    task.assignedTo = null;
    await task.save();

    await logActivity({
      workspaceId: task.workspaceId,
      entityType: 'task',
      entityId: task._id,
      action: 'unassigned',
      performedBy: user,
      message: `Task '${task.title}' unassigned by ${user.name}`
    });

    emitWorkspaceEvent(task.workspaceId, 'task:assigned', { task });
    return task;
  }

  const targetUser = await User.findById(assignedToUserId);
  if (!targetUser || targetUser.isDeleted) {
    throw new Error('Target user not found or deactivated');
  }

  if (workspace && !workspace.members.some(m => m.toString() === assignedToUserId.toString())) {
    throw new Error(`User '${targetUser.name}' is not a member of this workspace`);
  }

  const activeCount = await countActiveTasksForUser(assignedToUserId, task._id);
  if (activeCount >= MAX_ACTIVE_TASKS) {
    throw new Error(`User '${targetUser.name}' already has ${activeCount} active tasks (Maximum allowed: ${MAX_ACTIVE_TASKS})`);
  }

  task.assignedTo = targetUser._id;
  task.lastAssignedUserSnapshot = {
    userId: targetUser._id,
    name: targetUser.name,
    email: targetUser.email
  };

  await task.save();

  await logActivity({
    workspaceId: task.workspaceId,
    entityType: 'task',
    entityId: task._id,
    action: 'assigned',
    performedBy: user,
    message: `Task '${task.title}' assigned to '${targetUser.name}' by ${user.name}`,
    meta: { assignedToUserId: targetUser._id, assignedToName: targetUser.name }
  });

  emitWorkspaceEvent(task.workspaceId, 'task:assigned', { task });

  return task;
};

/**
 * Transitions task status according to transition table & role restrictions
 */
export const transitionTaskStatusService = async ({ taskId, newStatus, user }) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  const workspace = await Workspace.findById(task.workspaceId);
  if (workspace && workspace.isArchived) {
    throw new Error(`Workspace '${workspace.name}' is archived. Cannot modify task status.`);
  }

  if (!task.assignedTo) {
    throw new Error('Unassigned tasks cannot change status. Please assign an employee first.');
  }

  const currentStatus = task.status;
  if (currentStatus === newStatus) {
    return task;
  }

  const allowedRoles = ALLOWED_TRANSITIONS[currentStatus]?.[newStatus];

  if (!allowedRoles) {
    throw new Error(`Invalid status transition from '${currentStatus}' to '${newStatus}'`);
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Role '${user.role}' is not authorized to move task from '${currentStatus}' to '${newStatus}'`);
  }

  if (user.role === 'employee' && task.assignedTo.toString() !== user._id.toString()) {
    throw new Error('Employees can only move tasks assigned to themselves');
  }

  task.status = newStatus;
  await task.save();

  const isRevision = currentStatus === 'review' && newStatus === 'in_progress';
  const actionName = isRevision ? 'revision_requested' : 'status_changed';
  const logMsg = isRevision
    ? `Task '${task.title}' rejected in review and sent back to In Progress by Manager '${user.name}'`
    : `Task '${task.title}' moved from '${currentStatus}' to '${newStatus}' by ${user.name}`;

  await logActivity({
    workspaceId: task.workspaceId,
    entityType: 'task',
    entityId: task._id,
    action: actionName,
    performedBy: user,
    message: logMsg,
    meta: { fromStatus: currentStatus, toStatus: newStatus }
  });

  // Broadcast real-time status update to workspace room
  emitWorkspaceEvent(task.workspaceId, 'task:statusChanged', {
    taskId: task._id,
    fromStatus: currentStatus,
    toStatus: newStatus,
    status: task.status,
    task
  });

  return task;
};
