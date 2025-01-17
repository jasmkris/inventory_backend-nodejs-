import express from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { checkRole } from '../middleware/checkRole';
import {
  getAllRooms,
  getRoomById,
  getRoomObjects,
  createRoom,
  updateRoom,
  deleteRoom
} from '../controllers/roomController';

const router = express.Router();

// Get all rooms (all authenticated users)
router.get('/', auth, getAllRooms);

// Get specific room and its objects
router.get('/:roomId', auth, getRoomById);
router.get('/:roomId/objects', auth, getRoomObjects);

// Manager only routes
router.post(
  '/',
  auth,
  checkRole(['MANAGER']),
  validate([
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
    body('isTransit').optional().isBoolean()
  ]),
  createRoom
);

router.put(
  '/:roomId',
  auth,
  checkRole(['MANAGER']),
  validate([
    body('name').optional().notEmpty().trim(),
    body('description').optional().trim(),
    body('isTransit').optional().isBoolean()
  ]),
  updateRoom
);

router.delete('/:roomId', auth, checkRole(['MANAGER']), deleteRoom);

export default router; 