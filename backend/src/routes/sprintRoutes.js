import express from 'express';
import {
  createSprint,
  getSprintsByWorkspace,
  getSprintById,
  updateSprint,
  toggleSprintActive
} from '../controllers/sprintController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { checkWorkspaceMember } from '../middleware/workspaceAccess.js';

// Setting mergeParams: true allows accessing :workspaceId from parent router if nested
const router = express.Router({ mergeParams: true });

router.use(protect);

// Workspace-nested routes: /api/workspaces/:workspaceId/sprints
router.post('/workspaces/:workspaceId/sprints', requireRole('manager'), checkWorkspaceMember, createSprint);
router.get('/workspaces/:workspaceId/sprints', checkWorkspaceMember, getSprintsByWorkspace);

// Sprint direct routes: /api/sprints/:id
router.get('/sprints/:id', getSprintById);
router.patch('/sprints/:id', requireRole('manager'), updateSprint);
router.patch('/sprints/:id/toggle-active', requireRole('manager'), toggleSprintActive);

export default router;
