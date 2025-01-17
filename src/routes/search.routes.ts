import express from 'express';
import { query } from 'express-validator';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  searchObjects,
  searchRooms,
  globalSearch,
  getSearchSuggestions
} from '../controllers/searchController';

const router = express.Router();

router.get(
  '/objects',
  auth,
  validate([
    query('q').notEmpty(),
    query('category').optional(),
    query('roomId').optional(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ]),
  searchObjects
);

router.get(
  '/rooms',
  auth,
  validate([
    query('q').notEmpty(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ]),
  searchRooms
);

router.get(
  '/global',
  auth,
  validate([
    query('q').notEmpty(),
    query('type').optional().isIn(['object', 'room', 'all'])
  ]),
  globalSearch
);

router.get(
  '/suggestions',
  auth,
  validate([
    query('q').notEmpty(),
    query('type').optional().isIn(['object', 'room'])
  ]),
  getSearchSuggestions
);

export default router; 