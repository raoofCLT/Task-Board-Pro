import express from 'express';
import { getDashboardStats, getMyTaskStats } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

router.use(protect);

router.get('/', requireRole('admin', 'manager'), getDashboardStats);
router.get('/my-tasks', getMyTaskStats);

export default router;
