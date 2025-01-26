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
  deleteAllObjects,
  updateObjectQuantity,
  removeObjectQuantity
} from '../controllers/objectController';

const router = express.Router();

// Basic CRUD operations
router.post(
  '/',
  auth,
  validate([
    body('name').notEmpty().trim(),
    body('category').isIn(['TOOLS', 'GARDEN', 'AUTOMOTIVE', 'RED_WINE', 'WHITE_WINE', 'SPARKLING_WINE', 'TEXTILES', 'TABLEWARE', 'GLASSWARE', 'COOKWARE', 'MAINTENANCE', 'EQUIPMENT', 'CONSUMABLE', 'OTHER']),
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
    body('category').optional().isIn(['TOOLS', 'GARDEN', 'AUTOMOTIVE', 'RED_WINE', 'WHITE_WINE', 'SPARKLING_WINE', 'TEXTILES', 'TABLEWARE', 'GLASSWARE', 'COOKWARE', 'MAINTENANCE', 'EQUIPMENT', 'CONSUMABLE', 'OTHER']),
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
    body('quantity').isInt({ min: 1 }),
  ]),
  moveObject
);

router.put(
  '/:objectId/quantity',
  auth,
  validate([
    body('quantity').isInt({ min: 1 }),
  ]),
  updateObjectQuantity
);

router.put(
  '/:objectId/remove',
  auth,
  validate([
    body('quantity').isInt({ min: 1 }),
    body('deleteNote').optional().trim()
  ]),
  removeObjectQuantity
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