import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Workspace from '../models/Workspace.js';

/**
 * @desc    Get aggregated dashboard stats for Admin and Manager
 * @route   GET /api/dashboard
 * @access  Private/Admin/Manager
 */
export const getDashboardStats = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const matchFilter = {};

    if (workspaceId) {
      matchFilter.workspaceId = new mongoose.Types.ObjectId(workspaceId);
    } else if (req.user.role === 'manager') {
      // Scoped to manager's workspaces
      const userWorkspaces = await Workspace.find({ members: req.user._id }).select('_id');
      const wsIds = userWorkspaces.map(w => w._id);
      matchFilter.workspaceId = { $in: wsIds };
    }

    const now = new Date();

    // Aggregation pipeline for counts by status, priority, and overdue
    const [stats] = await Task.aggregate([
      { $match: matchFilter },
      {
        $facet: {
          totalTasks: [{ $count: 'count' }],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } }
          ],
          overdue: [
            {
              $match: {
                dueDate: { $lt: now },
                status: { $ne: 'done' }
              }
            },
            { $count: 'count' }
          ],
          perEmployee: [
            { $match: { assignedTo: { $ne: null } } },
            { $group: { _id: '$assignedTo', taskCount: { $sum: 1 } } },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'employee'
              }
            },
            { $unwind: '$employee' },
            {
              $project: {
                _id: 1,
                name: '$employee.name',
                email: '$employee.email',
                taskCount: 1
              }
            }
          ]
        }
      }
    ]);

    // Format aggregation results cleanly
    const formattedStatus = { todo: 0, in_progress: 0, review: 0, done: 0 };
    stats.byStatus.forEach(item => {
      formattedStatus[item._id] = item.count;
    });

    const formattedPriority = { low: 0, medium: 0, high: 0 };
    stats.byPriority.forEach(item => {
      formattedPriority[item._id] = item.count;
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalTasks: stats.totalTasks[0]?.count || 0,
        overdueTasks: stats.overdue[0]?.count || 0,
        byStatus: formattedStatus,
        byPriority: formattedPriority,
        employeeWorkload: stats.perEmployee
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get personal task statistics for Employee
 * @route   GET /api/dashboard/my-tasks
 * @access  Private
 */
export const getMyTaskStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const [stats] = await Task.aggregate([
      { $match: { assignedTo: userId } },
      {
        $facet: {
          totalAssigned: [{ $count: 'count' }],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          overdue: [
            {
              $match: {
                dueDate: { $lt: now },
                status: { $ne: 'done' }
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ]);

    const formattedStatus = { todo: 0, in_progress: 0, review: 0, done: 0 };
    stats.byStatus.forEach(item => {
      formattedStatus[item._id] = item.count;
    });

    const activeCount = formattedStatus.todo + formattedStatus.in_progress + formattedStatus.review;

    return res.status(200).json({
      success: true,
      stats: {
        totalAssigned: stats.totalAssigned[0]?.count || 0,
        activeTasks: activeCount,
        completedTasks: formattedStatus.done,
        overdueTasks: stats.overdue[0]?.count || 0,
        byStatus: formattedStatus
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
