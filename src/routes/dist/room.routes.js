"use strict";
exports.__esModule = true;
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var auth_1 = require("../middleware/auth");
var validate_1 = require("../middleware/validate");
var checkRole_1 = require("../middleware/checkRole");
var roomController_1 = require("../controllers/roomController");
var router = express_1["default"].Router();
// Get all rooms (all authenticated users)
router.get('/', auth_1.auth, roomController_1.getAllRooms);
// Get specific room and its objects
router.get('/:roomId', auth_1.auth, roomController_1.getRoomById);
router.get('/:roomId/objects', auth_1.auth, roomController_1.getRoomObjects);
// Manager only routes
router.post('/', auth_1.auth, checkRole_1.checkRole(['MANAGER']), validate_1.validate([
    express_validator_1.body('name').notEmpty().trim(),
    express_validator_1.body('description').optional().trim(),
    express_validator_1.body('isTransit').optional().isBoolean()
]), roomController_1.createRoom);
router.put('/:roomId', auth_1.auth, checkRole_1.checkRole(['MANAGER']), validate_1.validate([
    express_validator_1.body('name').optional().notEmpty().trim(),
    express_validator_1.body('description').optional().trim(),
    express_validator_1.body('isTransit').optional().isBoolean()
]), roomController_1.updateRoom);
router["delete"]('/:roomId', auth_1.auth, checkRole_1.checkRole(['MANAGER']), roomController_1.deleteRoom);
exports["default"] = router;
