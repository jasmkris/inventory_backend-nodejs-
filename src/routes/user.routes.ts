import express from 'express';
import { auth } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import {
  updateProfile,
  uploadPhoto,
  getAllUsers,
  deleteUser,
  updateUserRole,
  approveUser,
  rejectUser,
  revokeUser
} from '../controllers/userController';
import { upload as uploadMiddleware } from '../middleware/upload';

const router = express.Router();

router.put('/profile', auth, updateProfile);
router.post('/profile/photo', auth, uploadMiddleware.single('file'), uploadPhoto);

// Manager only routes
router.get('/all', auth, checkRole(['MANAGER']), getAllUsers);
router.put('/:userId/role', auth, checkRole(['MANAGER']), updateUserRole);
router.delete('/:userId', auth, checkRole(['MANAGER']), deleteUser);

router.put('/approve/:userId', auth, checkRole(['MANAGER']), approveUser);
router.delete('/reject/:userId', auth, checkRole(['MANAGER']), rejectUser);
router.put('/revoke/:userId', auth, checkRole(['MANAGER']), revokeUser);

export default router; 