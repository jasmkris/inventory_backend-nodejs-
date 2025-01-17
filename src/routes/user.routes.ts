import express from 'express';
import { auth } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import {
  updateProfile,
  uploadPhoto,
  getAllUsers,
  deleteUser,
  updateUserRole
} from '../controllers/userController';

const router = express.Router();

router.put('/profile', auth, updateProfile);
router.post('/profile/photo', auth, uploadPhoto);

// Manager only routes
router.get('/all', auth, checkRole(['MANAGER']), getAllUsers);
router.put('/:userId/role', auth, checkRole(['MANAGER']), updateUserRole);
router.delete('/:userId', auth, checkRole(['MANAGER']), deleteUser);

export default router; 