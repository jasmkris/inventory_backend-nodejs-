"use strict";
exports.__esModule = true;
var express_1 = require("express");
var auth_1 = require("../middleware/auth");
var checkRole_1 = require("../middleware/checkRole");
var userController_1 = require("../controllers/userController");
var router = express_1["default"].Router();
router.put('/profile', auth_1.auth, userController_1.updateProfile);
router.post('/profile/photo', auth_1.auth, userController_1.uploadPhoto);
// Manager only routes
router.get('/all', auth_1.auth, checkRole_1.checkRole(['MANAGER']), userController_1.getAllUsers);
router.put('/:userId/role', auth_1.auth, checkRole_1.checkRole(['MANAGER']), userController_1.updateUserRole);
router["delete"]('/:userId', auth_1.auth, checkRole_1.checkRole(['MANAGER']), userController_1.deleteUser);
exports["default"] = router;
