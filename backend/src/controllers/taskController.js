import Task from '../models/Task.js';
import Workspace from '../models/Workspace.js';
import {
  createTaskService,
  assignTaskService,
  transitionTaskStatusService
} from '../services/taskService.js';
import { logActivity } from '../services/activityLogService.js';
import { emitWorkspaceEvent } from '../sockets/socketHandler.js';

/**
 * @desc    Create a new Task in a Sprint
 * @route   POST /api/sprints/:sprintId/tasks
 * @access  Private/Manager
 */
export const createTask = async (req, res) => {
  try {
    const { sprintId } = req.params;
    const { title, description, priority, dueDate, assignedTo, workspaceId, labels } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide task title and dueDate'
      });
    }

    const task = await createTaskService({
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      sprintId,
      workspaceId,
      labels,
      user: req.user
    });

    return res.status(201).json({
      success: true,
      task
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get Tasks with role-filtering & pagination
 * @route   GET /api/tasks
 * @access  Private (Admin: all; Manager: own member workspaces only; Employee: assigned to self only)
 */
export const getTasks = async (req, res) => {
  try {
    const { workspaceId, sprintId, status, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (workspaceId) filter.workspaceId = workspaceId;
    if (sprintId) filter.sprintId = sprintId;
    if (status) filter.status = status;

    if (req.user.role === 'employee') {
      filter.assignedTo = req.user._id;
    } else if (req.user.role === 'manager') {
      const userWorkspaces = await Workspace.find({ members: req.user._id }).select('_id');
      const workspaceIds = userWorkspaces.map(w => w._id.toString());

      if (workspaceId) {
        // Enforce strict workspace membership even if workspaceId is explicitly passed in query
        if (!workspaceIds.includes(workspaceId.toString())) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: You are not a member of this workspace'
          });
        }
      } else {
        filter.workspaceId = { $in: workspaceIds };
      }
    }
    // Admin sees all without restrictions

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const totalTasks = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('workspaceId', 'name')
      .populate('sprintId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: tasks.length,
      total: totalTasks,
      totalPages: Math.ceil(totalTasks / limitNum) || 1,
      currentPage: pageNum,
      tasks
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get single Task details
 * @route   GET /api/tasks/:id
 * @access  Private
 */
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('workspaceId', 'name')
      .populate('sprintId', 'name')
      .populate('comments.author', 'name email role');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Role check for Employee
    if (req.user.role === 'employee' && task.assignedTo?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view tasks assigned to you'
      });
    }

    // Role check for Manager: Must be a member of the task's workspace
    if (req.user.role === 'manager') {
      const workspace = await Workspace.findById(task.workspaceId);
      const isMember = workspace?.members.some(m => m.toString() === req.user._id.toString());
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not a member of this workspace'
        });
      }
    }

    return res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update task details (title, description, priority, dueDate, labels)
 * @route   PATCH /api/tasks/:id
 * @access  Private/Manager
 */
export const updateTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, labels } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const workspace = await Workspace.findById(task.workspaceId);
    if (workspace && workspace.isArchived) {
      return res.status(403).json({
        success: false,
        message: `Workspace '${workspace.name}' is archived. Cannot edit tasks.`
      });
    }

    if (req.user.role !== 'admin' && (!workspace || !workspace.members.some(m => m.toString() === req.user._id.toString()))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this workspace'
      });
    }

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;
    if (labels) task.labels = labels;

    await task.save();

    await logActivity({
      workspaceId: task.workspaceId,
      entityType: 'task',
      entityId: task._id,
      action: 'updated',
      performedBy: req.user,
      message: `Task '${task.title}' updated by ${req.user.name}`
    });

    emitWorkspaceEvent(task.workspaceId, 'task:updated', { task });

    return res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Assign or reassign task
 * @route   PATCH /api/tasks/:id/assign
 * @access  Private/Manager
 */
export const assignTask = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const task = await assignTaskService({
      taskId: req.params.id,
      assignedToUserId: assignedTo,
      user: req.user
    });

    const updatedTask = await Task.findById(task._id).populate('assignedTo', 'name email role');

    return res.status(200).json({
      success: true,
      message: assignedTo ? 'Task assigned successfully' : 'Task unassigned successfully',
      task: updatedTask
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Transition task status (todo -> in_progress -> review -> done)
 * @route   PATCH /api/tasks/:id/status
 * @access  Private (Role-gated inside taskService)
 */
export const transitionTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status'
      });
    }

    const task = await transitionTaskStatusService({
      taskId: req.params.id,
      newStatus: status,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      message: `Task status updated to ${status}`,
      task
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Add a comment to a Task (Workspace members & Admin)
 * @route   POST /api/tasks/:id/comments
 * @access  Private
 */
export const addCommentToTask = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const workspace = await Workspace.findById(task.workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    if (workspace.isArchived) {
      return res.status(403).json({
        success: false,
        message: `Workspace '${workspace.name}' is archived. Cannot add comments.`
      });
    }

    const isMember = workspace.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this workspace'
      });
    }

    const comment = {
      text,
      author: req.user._id,
      authorName: req.user.name
    };

    task.comments.push(comment);
    await task.save();

    await logActivity({
      workspaceId: task.workspaceId,
      entityType: 'task',
      entityId: task._id,
      action: 'comment_added',
      performedBy: req.user,
      message: `${req.user.name} commented on task '${task.title}'`
    });

    emitWorkspaceEvent(task.workspaceId, 'task:commentAdded', {
      taskId: task._id,
      comment
    });

    const updatedTask = await Task.findById(task._id)
      .populate('comments.author', 'name email role');

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comments: updatedTask.comments
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
