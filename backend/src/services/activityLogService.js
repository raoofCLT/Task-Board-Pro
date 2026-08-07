import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';

/**
 * Activity Log Service
 * Creates an activity log entry for audit and activity history tracking.
 * 
 * @param {Object} params
 * @param {string} params.workspaceId - ID of the target workspace
 * @param {string} params.entityType - 'task' | 'sprint' | 'workspace' | 'user'
 * @param {string} params.entityId - ID of the entity being acted upon
 * @param {string} params.action - Action name (e.g. 'created', 'status_changed', 'archived')
 * @param {string|Object} params.performedBy - User ID or User document who performed the action
 * @param {string} [params.performedByName] - Optional name of the user performing the action
 * @param {string} params.message - Human readable activity log message
 * @param {Object} [params.meta] - Optional additional metadata object
 */
export const logActivity = async ({
  workspaceId,
  entityType,
  entityId,
  action,
  performedBy,
  performedByName,
  message,
  meta = {}
}) => {
  try {
    let userId = performedBy;
    let userName = performedByName;

    // If performedBy is passed as a populated Mongoose User object
    if (typeof performedBy === 'object' && performedBy !== null && performedBy._id) {
      userId = performedBy._id;
      if (!userName && performedBy.name) {
        userName = performedBy.name;
      }
    }

    // If performedByName was not passed, fetch user's name from database
    if (!userName && userId) {
      const user = await User.findById(userId).select('name');
      if (user) {
        userName = user.name;
      } else {
        userName = 'Unknown User';
      }
    }

    const logEntry = await ActivityLog.create({
      workspaceId,
      entityType,
      entityId,
      action,
      performedBy: userId,
      performedByName: userName || 'System',
      message,
      meta
    });

    return logEntry;
  } catch (error) {
    // Logging failures should not crash the main application request, but we log to console
    console.error('Failed to record activity log:', error.message);
    return null;
  }
};
