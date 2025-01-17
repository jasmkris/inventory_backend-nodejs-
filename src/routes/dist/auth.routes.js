"use strict";
exports.__esModule = true;
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var authController_1 = require("../controllers/authController");
var validate_1 = require("../middleware/validate");
var router = express_1["default"].Router();
router.post('/register', validate_1.validate([
    express_validator_1.body('email').isEmail().normalizeEmail(),
    express_validator_1.body('password').isLength({ min: 6 }),
    express_validator_1.body('firstName').notEmpty(),
    express_validator_1.body('lastName').notEmpty()
]), authController_1.register);
router.post('/login', validate_1.validate([
    express_validator_1.body('email').isEmail().normalizeEmail(),
    express_validator_1.body('password').notEmpty()
]), authController_1.login);
router.post('/verify-email', validate_1.validate([
    express_validator_1.body('token').notEmpty()
]), authController_1.verifyEmail);
exports["default"] = router;
