import ActivityLog from '../models/ActivityLog.js';
import Workspace from '../models/Workspace.js';
import Task from '../models/Task.js';

/**
 * @desc    Get activity logs with role-based filtering and pagination
 * @route   GET /api/activity-logs
 * @access  Private
 */
export const getActivityLogs = async (req, res) => {
  try {
    const { workspaceId, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (workspaceId) {
      filter.workspaceId = workspaceId;
    }

    // Enforce role-based access to activity logs
    if (req.user.role === 'employee') {
      // Employee spec rule: Server-side filtered to only entries about their own tasks / actions
      const myTasks = await Task.find({ assignedTo: req.user._id }).select('_id');
      const myTaskIds = myTasks.map(t => t._id);

      filter.$or = [
        { performedBy: req.user._id },
        { entityId: { $in: myTaskIds } }
      ];
    } else if (req.user.role === 'manager') {
      // Manager can view logs within their workspaces
      if (!workspaceId) {
        const userWorkspaces = await Workspace.find({ members: req.user._id }).select('_id');
        const workspaceIds = userWorkspaces.map(w => w._id);
        filter.workspaceId = { $in: workspaceIds };
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const totalLogs = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
      .populate('performedBy', 'name email role')
      .populate('workspaceId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: logs.length,
      total: totalLogs,
      totalPages: Math.ceil(totalLogs / limitNum) || 1,
      currentPage: pageNum,
      logs
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
