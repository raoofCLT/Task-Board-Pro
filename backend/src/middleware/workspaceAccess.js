import Workspace from '../models/Workspace.js';

/**
 * Workspace Access Middleware
 * Ensures the authenticated user is a member of the target workspace (or is an Admin)
 * and that modifications are blocked if the workspace is archived.
 */
export const checkWorkspaceMember = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: 'Workspace ID is required'
      });
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Freeze modifications if workspace is archived
    if (workspace.isArchived && req.method !== 'GET') {
      return res.status(403).json({
        success: false,
        message: `Workspace '${workspace.name}' is archived. All modifications are frozen.`
      });
    }

    // Check membership: Admins bypass; Managers & Employees must be in workspace.members
    const isMember = workspace.members.some(m => m.toString() === req.user._id.toString());

    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this workspace'
      });
    }

    // Attach workspace to req for downstream usage
    req.workspace = workspace;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
