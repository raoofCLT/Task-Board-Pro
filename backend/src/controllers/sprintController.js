import Sprint from '../models/Sprint.js';
import Workspace from '../models/Workspace.js';
import { logActivity } from '../services/activityLogService.js';

/**
 * @desc    Create a new Sprint within a Workspace
 * @route   POST /api/workspaces/:workspaceId/sprints
 * @access  Private/Manager
 */
export const createSprint = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, startDate, endDate, isActive = false } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide sprint name, startDate, and endDate'
      });
    }

    // req.workspace is attached by checkWorkspaceMember middleware
    const workspace = req.workspace || await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    if (workspace.isArchived) {
      return res.status(403).json({
        success: false,
        message: `Workspace '${workspace.name}' is archived. Cannot create sprints.`
      });
    }

    const sprint = await Sprint.create({
      workspaceId: workspace._id,
      name,
      startDate,
      endDate,
      isActive: Boolean(isActive)
    });

    await logActivity({
      workspaceId: workspace._id,
      entityType: 'sprint',
      entityId: sprint._id,
      action: 'created',
      performedBy: req.user,
      message: `Sprint '${sprint.name}' created in workspace '${workspace.name}' by Manager '${req.user.name}'`
    });

    return res.status(201).json({
      success: true,
      sprint
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all sprints in a workspace
 * @route   GET /api/workspaces/:workspaceId/sprints
 * @access  Private
 */
export const getSprintsByWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const sprints = await Sprint.find({ workspaceId }).sort({ startDate: -1 });

    return res.status(200).json({
      success: true,
      count: sprints.length,
      sprints
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get single sprint by ID
 * @route   GET /api/sprints/:id
 * @access  Private
 */
export const getSprintById = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found'
      });
    }

    return res.status(200).json({
      success: true,
      sprint
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Update Sprint details
 * @route   PATCH /api/sprints/:id
 * @access  Private/Manager
 */
export const updateSprint = async (req, res) => {
  try {
    const { name, startDate, endDate, isActive } = req.body;

    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found'
      });
    }

    const workspace = await Workspace.findById(sprint.workspaceId);
    if (workspace && workspace.isArchived) {
      return res.status(403).json({
        success: false,
        message: `Workspace '${workspace.name}' is archived. Cannot edit sprints.`
      });
    }

    // Verify manager membership if not admin
    if (req.user.role !== 'admin' && (!workspace || !workspace.members.some(m => m.toString() === req.user._id.toString()))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this sprint workspace'
      });
    }

    if (name) sprint.name = name;
    if (startDate) sprint.startDate = startDate;
    if (endDate) sprint.endDate = endDate;
    if (isActive !== undefined) sprint.isActive = Boolean(isActive);

    await sprint.save();

    await logActivity({
      workspaceId: sprint.workspaceId,
      entityType: 'sprint',
      entityId: sprint._id,
      action: 'updated',
      performedBy: req.user,
      message: `Sprint '${sprint.name}' updated by Manager '${req.user.name}'`
    });

    return res.status(200).json({
      success: true,
      sprint
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Toggle Sprint isActive status
 * @route   PATCH /api/sprints/:id/toggle-active
 * @access  Private/Manager
 */
export const toggleSprintActive = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({
        success: false,
        message: 'Sprint not found'
      });
    }

    const workspace = await Workspace.findById(sprint.workspaceId);
    if (workspace && workspace.isArchived) {
      return res.status(403).json({
        success: false,
        message: `Workspace '${workspace.name}' is archived. Cannot toggle sprint active state.`
      });
    }

    if (req.user.role !== 'admin' && (!workspace || !workspace.members.some(m => m.toString() === req.user._id.toString()))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this sprint workspace'
      });
    }

    sprint.isActive = !sprint.isActive;
    await sprint.save();

    const statusText = sprint.isActive ? 'activated' : 'deactivated';

    await logActivity({
      workspaceId: sprint.workspaceId,
      entityType: 'sprint',
      entityId: sprint._id,
      action: statusText,
      performedBy: req.user,
      message: `Sprint '${sprint.name}' was ${statusText} by Manager '${req.user.name}'`
    });

    return res.status(200).json({
      success: true,
      message: `Sprint '${sprint.name}' is now ${statusText}`,
      isActive: sprint.isActive,
      sprint
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
