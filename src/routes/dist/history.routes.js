"use strict";
exports.__esModule = true;
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var auth_1 = require("../middleware/auth");
var validate_1 = require("../middleware/validate");
var historyController_1 = require("../controllers/historyController");
var router = express_1["default"].Router();
// Global history with filters
router.get('/', auth_1.auth, validate_1.validate([
    express_validator_1.query('startDate').optional().isISO8601(),
    express_validator_1.query('endDate').optional().isISO8601(),
    express_validator_1.query('action').optional().isIn(['CREATE', 'UPDATE', 'DELETE', 'MOVE', 'TRANSIT']),
    express_validator_1.query('userId').optional().isString(),
    express_validator_1.query('roomId').optional().isString(),
    express_validator_1.query('page').optional().isInt({ min: 1 }),
    express_validator_1.query('limit').optional().isInt({ min: 1, max: 100 })
]), historyController_1.getGlobalHistory);
// Room specific history
router.get('/room/:roomId', auth_1.auth, validate_1.validate([
    express_validator_1.query('startDate').optional().isISO8601(),
    express_validator_1.query('endDate').optional().isISO8601(),
    express_validator_1.query('page').optional().isInt({ min: 1 }),
    express_validator_1.query('limit').optional().isInt({ min: 1, max: 100 })
]), historyController_1.getRoomHistory);
// User specific history
router.get('/user/:userId', auth_1.auth, validate_1.validate([
    express_validator_1.query('startDate').optional().isISO8601(),
    express_validator_1.query('endDate').optional().isISO8601(),
    express_validator_1.query('page').optional().isInt({ min: 1 }),
    express_validator_1.query('limit').optional().isInt({ min: 1, max: 100 })
]), historyController_1.getUserHistory);
// History statistics
router.get('/stats', auth_1.auth, historyController_1.getHistoryStats);
exports["default"] = router;
