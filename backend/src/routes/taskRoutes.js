import express from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  assignTask,
  transitionTaskStatus,
  addCommentToTask
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

// Nested route: /api/sprints/:sprintId/tasks
router.post('/sprints/:sprintId/tasks', requireRole('manager'), createTask);

// Task direct endpoints: /api/tasks
router.get('/tasks', getTasks);
router.get('/tasks/:id', getTaskById);
router.patch('/tasks/:id', requireRole('manager'), updateTask);
router.patch('/tasks/:id/assign', requireRole('manager'), assignTask);
router.patch('/tasks/:id/status', transitionTaskStatus);
router.post('/tasks/:id/comments', addCommentToTask);

export default router;
