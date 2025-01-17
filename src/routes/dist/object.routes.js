"use strict";
exports.__esModule = true;
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var auth_1 = require("../middleware/auth");
var validate_1 = require("../middleware/validate");
var objectController_1 = require("../controllers/objectController");
var router = express_1["default"].Router();
// Basic CRUD operations
router.post('/', auth_1.auth, validate_1.validate([
    express_validator_1.body('name').notEmpty().trim(),
    express_validator_1.body('category').isIn(['CONSUMABLE', 'TEXTILE', 'EQUIPMENT', 'OTHER']),
    express_validator_1.body('quantity').isInt({ min: 1 }),
    express_validator_1.body('roomId').notEmpty(),
    express_validator_1.body('description').optional().trim()
]), objectController_1.createObject);
router.get('/:objectId', auth_1.auth, objectController_1.getObjectById);
router.put('/:objectId', auth_1.auth, validate_1.validate([
    express_validator_1.body('name').optional().notEmpty().trim(),
    express_validator_1.body('category').optional().isIn(['CONSUMABLE', 'TEXTILE', 'EQUIPMENT', 'OTHER']),
    express_validator_1.body('quantity').optional().isInt({ min: 1 }),
    express_validator_1.body('description').optional().trim()
]), objectController_1.updateObject);
router["delete"]('/:objectId', auth_1.auth, objectController_1.deleteObject);
// Special operations
router.post('/:objectId/move', auth_1.auth, validate_1.validate([
    express_validator_1.body('roomId').notEmpty(),
    express_validator_1.body('reason').optional().trim()
]), objectController_1.moveObject);
router.post('/:objectId/variant', auth_1.auth, validate_1.validate([
    express_validator_1.body('name').optional().notEmpty().trim(),
    express_validator_1.body('quantity').isInt({ min: 1 }),
    express_validator_1.body('roomId').notEmpty(),
    express_validator_1.body('description').optional().trim()
]), objectController_1.createVariant);
router.post('/:objectId/transit', auth_1.auth, validate_1.validate([
    express_validator_1.body('reason').notEmpty().trim()
]), objectController_1.transitObject);
// History
router.get('/:objectId/history', auth_1.auth, objectController_1.getObjectHistory);
exports["default"] = router;
