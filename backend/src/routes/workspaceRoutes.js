import express from 'express';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  toggleArchiveWorkspace,
  manageWorkspaceMembers
} from '../controllers/workspaceController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

// All workspace routes require authentication
router.use(protect);

router.get('/', getWorkspaces);
router.get('/:id', getWorkspaceById);

// Admin-only management endpoints
router.post('/', requireRole('admin'), createWorkspace);
router.patch('/:id', requireRole('admin'), updateWorkspace);
router.patch('/:id/archive', requireRole('admin'), toggleArchiveWorkspace);
router.patch('/:id/members', requireRole('admin'), manageWorkspaceMembers);

export default router;
