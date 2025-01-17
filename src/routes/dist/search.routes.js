"use strict";
exports.__esModule = true;
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var auth_1 = require("../middleware/auth");
var validate_1 = require("../middleware/validate");
var searchController_1 = require("../controllers/searchController");
var router = express_1["default"].Router();
router.get('/objects', auth_1.auth, validate_1.validate([
    express_validator_1.query('q').notEmpty(),
    express_validator_1.query('category').optional(),
    express_validator_1.query('roomId').optional(),
    express_validator_1.query('page').optional().isInt({ min: 1 }),
    express_validator_1.query('limit').optional().isInt({ min: 1, max: 100 })
]), searchController_1.searchObjects);
router.get('/rooms', auth_1.auth, validate_1.validate([
    express_validator_1.query('q').notEmpty(),
    express_validator_1.query('page').optional().isInt({ min: 1 }),
    express_validator_1.query('limit').optional().isInt({ min: 1, max: 100 })
]), searchController_1.searchRooms);
router.get('/global', auth_1.auth, validate_1.validate([
    express_validator_1.query('q').notEmpty(),
    express_validator_1.query('type').optional().isIn(['object', 'room', 'all'])
]), searchController_1.globalSearch);
router.get('/suggestions', auth_1.auth, validate_1.validate([
    express_validator_1.query('q').notEmpty(),
    express_validator_1.query('type').optional().isIn(['object', 'room'])
]), searchController_1.getSearchSuggestions);
exports["default"] = router;
