import Workspace from '../models/Workspace.js';
import Sprint from '../models/Sprint.js';
import User from '../models/User.js';
import { logActivity } from '../services/activityLogService.js';

/**
 * @desc    Create a new Workspace
 * @route   POST /api/workspaces
 * @access  Private/Admin
 */
export const createWorkspace = async (req, res) => {
  try {
    const { name, description, members = [] } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Workspace name is required'
      });
    }

    const workspace = await Workspace.create({
      name,
      description: description || '',
      createdBy: req.user._id,
      members
    });

    await logActivity({
      workspaceId: workspace._id,
      entityType: 'workspace',
      entityId: workspace._id,
      action: 'created',
      performedBy: req.user,
      message: `Workspace '${workspace.name}' created by Admin '${req.user.name}'`
    });

    return res.status(201).json({
      success: true,
      workspace
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all accessible Workspaces (Admin: all; Manager/Employee: member of)
 * @route   GET /api/workspaces
 * @access  Private
 */
export const getWorkspaces = async (req, res) => {
  try {
    let filter = {};

    // Admin sees all workspaces; Managers and Employees only see workspaces they belong to
    if (req.user.role !== 'admin') {
      filter = { members: req.user._id, isArchived: false };
    }

    const workspaces = await Workspace.find(filter)
      .populate('createdBy', 'name email')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: workspaces.length,
      workspaces
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get single Workspace details
 * @route   GET /api/workspaces/:id
 * @access  Private
 */
export const getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email role');

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Role check: non-admin must be a member
    if (req.user.role !== 'admin' && !workspace.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this workspace'
      });
    }

    return res.status(200).json({
      success: true,
      workspace
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update Workspace details
 * @route   PATCH /api/workspaces/:id
 * @access  Private/Admin
 */
export const updateWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;

    await workspace.save();

    await logActivity({
      workspaceId: workspace._id,
      entityType: 'workspace',
      entityId: workspace._id,
      action: 'updated',
      performedBy: req.user,
      message: `Workspace '${workspace.name}' updated by Admin '${req.user.name}'`
    });

    return res.status(200).json({
      success: true,
      workspace
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Toggle Workspace archive state (Blocked if active sprint exists)
 * @route   PATCH /api/workspaces/:id/archive
 * @access  Private/Admin
 */
export const toggleArchiveWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Business Rule: Cannot archive workspace if any active sprint exists
    if (!workspace.isArchived) {
      const activeSprint = await Sprint.findOne({
        workspaceId: workspace._id,
        isActive: true
      });

      if (activeSprint) {
        return res.status(400).json({
          success: false,
          message: `Cannot archive workspace '${workspace.name}' while active sprint '${activeSprint.name}' exists. Please deactivate all sprints first.`
        });
      }
    }

    workspace.isArchived = !workspace.isArchived;
    await workspace.save();

    const actionText = workspace.isArchived ? 'archived' : 'unarchived';

    await logActivity({
      workspaceId: workspace._id,
      entityType: 'workspace',
      entityId: workspace._id,
      action: actionText,
      performedBy: req.user,
      message: `Workspace '${workspace.name}' was ${actionText} by Admin '${req.user.name}'`
    });

    return res.status(200).json({
      success: true,
      message: `Workspace '${workspace.name}' has been ${actionText}`,
      isArchived: workspace.isArchived
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Add or remove member in Workspace
 * @route   PATCH /api/workspaces/:id/members
 * @access  Private/Admin
 */
export const manageWorkspaceMembers = async (req, res) => {
  try {
    const { userId, action } = req.body; // action: 'add' | 'remove'

    if (!userId || !['add', 'remove'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Please provide userId and action ('add' or 'remove')"
      });
    }

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser || targetUser.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found or deactivated'
      });
    }

    const memberExists = workspace.members.some(m => m.toString() === userId.toString());

    if (action === 'add') {
      if (memberExists) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this workspace'
        });
      }
      workspace.members.push(userId);
    } else if (action === 'remove') {
      if (!memberExists) {
        return res.status(400).json({
          success: false,
          message: 'User is not a member of this workspace'
        });
      }
      workspace.members = workspace.members.filter(m => m.toString() !== userId.toString());
    }

    await workspace.save();

    await logActivity({
      workspaceId: workspace._id,
      entityType: 'workspace',
      entityId: workspace._id,
      action: `member_${action}ed`,
      performedBy: req.user,
      message: `User '${targetUser.name}' was ${action}ed ${action === 'add' ? 'to' : 'from'} workspace '${workspace.name}' by Admin '${req.user.name}'`,
      meta: { targetUserId: targetUser._id, action }
    });

    const updatedWorkspace = await Workspace.findById(workspace._id).populate('members', 'name email role');

    return res.status(200).json({
      success: true,
      message: `User '${targetUser.name}' ${action}ed successfully`,
      members: updatedWorkspace.members
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
