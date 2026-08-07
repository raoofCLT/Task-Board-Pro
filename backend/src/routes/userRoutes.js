import express from 'express';
import { getUsers, createUser, deleteUser } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

// All user management routes require login and Admin role
router.use(protect);
router.use(requireRole('admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.delete('/:id', deleteUser);

export default router;
