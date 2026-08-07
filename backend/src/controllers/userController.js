import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { logActivity } from '../services/activityLogService.js';

/**
 * @desc    Get all users (excluding soft-deleted)
 * @route   GET /api/users
 * @access  Private/Admin
 */
export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = { isDeleted: false };
    
    if (role && ['admin', 'manager', 'employee'].includes(role)) {
      filter.role = role;
    }

    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Create a new user (Admin creation of Admin/Manager/Employee)
 * @route   POST /api/users
 * @access  Private/Admin
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role'
      });
    }

    if (!['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role provided'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role
    });

    return res.status(201).json({
      success: true,
      message: `User created successfully as ${role}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
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
 * @desc    Soft-delete a user (Deactivates user, unassigns their tasks with snapshot, logs activity)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user || user.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found or already deleted'
      });
    }

    // Soft delete user
    user.isDeleted = true;
    await user.save();

    // Cascade step: Find all active/pending tasks assigned to this user
    const assignedTasks = await Task.find({ assignedTo: user._id });

    if (assignedTasks.length > 0) {
      // Unassign tasks and store snapshot of deleted user details for audit history
      await Task.updateMany(
        { assignedTo: user._id },
        {
          $set: {
            assignedTo: null,
            lastAssignedUserSnapshot: {
              userId: user._id,
              name: user.name,
              email: user.email
            }
          }
        }
      );
    }

    // Record activity log using req.user (efficient in-memory object passing)
    // For user soft-delete, log under system/workspace context if needed or first task's workspace
    const workspaceIdForLog = assignedTasks.length > 0 ? assignedTasks[0].workspaceId : null;

    if (workspaceIdForLog) {
      await logActivity({
        workspaceId: workspaceIdForLog,
        entityType: 'user',
        entityId: user._id,
        action: 'deleted',
        performedBy: req.user,
        message: `User '${user.name}' (${user.email}) was deactivated by Admin '${req.user.name}'. Unassigned ${assignedTasks.length} task(s).`,
        meta: {
          unassignedTasksCount: assignedTasks.length,
          deactivatedUserRole: user.role
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: `User '${user.name}' soft-deleted successfully. Unassigned ${assignedTasks.length} task(s).`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
