import express from 'express';
import { query } from 'express-validator';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getGlobalHistory,
  getRoomHistory,
  getUserHistory,
  getHistoryStats,
  getDashboardHistory
} from '../controllers/historyController';

const router = express.Router();

// Global history with filters
router.get(
  '/',
  auth,
  validate([
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('action').optional().isIn(['CREATE', 'UPDATE', 'DELETE', 'MOVE', 'TRANSIT', 'REMOVE']),
    query('userId').optional().isString(),
    query('roomId').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ]),
  getGlobalHistory
);

// Room specific history
router.get(
  '/room/:roomId',
  auth,
  validate([
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ]),
  getRoomHistory
);

// User specific history
router.get(
  '/user/:userId',
  auth,
  validate([
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ]),
  getUserHistory
);

// History statistics
router.get('/stats', auth, getHistoryStats);

router.get('/dashboard', getDashboardHistory);

export default router; 