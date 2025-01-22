import express from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createObject,
  getObjectById,
  updateObject,
  deleteObject,
  moveObject,
  createVariant,
  getObjectHistory,
  transitObject,
  getAllObjects,
  deleteAllObjects
} from '../controllers/objectController';

const router = express.Router();

// Basic CRUD operations
router.post(
  '/',
  auth,
  validate([
    body('name').notEmpty().trim(),
    body('category').isIn(['CONSUMABLE', 'TEXTILE', 'EQUIPMENT', 'OTHER']),
    body('quantity').isInt({ min: 1 }),
    body('roomId').notEmpty(),
    body('description').optional().trim()
  ]),
  createObject
);

router.get('/', auth, getAllObjects);

router.get('/:objectId', auth, getObjectById);

router.put(
  '/:objectId',
  auth,
  validate([
    body('name').optional().notEmpty().trim(),
    body('category').optional().isIn(['CONSUMABLE', 'TEXTILE', 'EQUIPMENT', 'OTHER']),
    body('quantity').optional().isInt({ min: 1 }),
    body('description').optional().trim(),
    body('roomId').optional().notEmpty()
  ]),
  updateObject
);

router.delete('/', auth, deleteObject);

router.delete('/all/:roomId', auth, deleteAllObjects);
// Special operations
router.post(
  '/:objectId/move',
  auth,
  validate([
    body('roomId').notEmpty(),
    body('reason').optional().trim()
  ]),
  moveObject
);

router.post(
  '/:objectId/variant',
  auth,
  validate([
    body('name').optional().notEmpty().trim(),
    body('quantity').isInt({ min: 1 }),
    body('roomId').notEmpty(),
    body('description').optional().trim()
  ]),
  createVariant
);

router.post(
  '/:objectId/transit',
  auth,
  validate([
    body('reason').notEmpty().trim()
  ]),
  transitObject
);

// History
router.get('/:objectId/history', auth, getObjectHistory);

export default router; 