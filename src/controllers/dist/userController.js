"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.deleteUser = exports.updateUserRole = exports.getAllUsers = exports.uploadPhoto = exports.updateProfile = exports.getProfile = void 0;
var client_1 = require("@prisma/client");
var bcryptjs_1 = require("bcryptjs");
var prisma = new client_1.PrismaClient();
exports.getProfile = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma.user.findUnique({
                        where: { id: req.user.id },
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            photoUrl: true,
                            role: true,
                            isVerified: true
                        }
                    })];
            case 1:
                user = _a.sent();
                res.json(user);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res.status(500).json({ error: 'Server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateProfile = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var _a, firstName, lastName, email, currentPassword, newPassword, updateData, user, isMatch, _b, updatedUser, error_2;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 6, , 7]);
                _a = req.body, firstName = _a.firstName, lastName = _a.lastName, email = _a.email, currentPassword = _a.currentPassword, newPassword = _a.newPassword;
                updateData = {};
                if (firstName)
                    updateData.firstName = firstName;
                if (lastName)
                    updateData.lastName = lastName;
                if (email)
                    updateData.email = email;
                if (!newPassword) return [3 /*break*/, 4];
                return [4 /*yield*/, prisma.user.findUnique({
                        where: { id: req.user.id }
                    })];
            case 1:
                user = _c.sent();
                return [4 /*yield*/, bcryptjs_1["default"].compare(currentPassword, user.password)];
            case 2:
                isMatch = _c.sent();
                if (!isMatch) {
                    res.status(400).json({ error: 'Current password is incorrect' });
                    return [2 /*return*/];
                }
                _b = updateData;
                return [4 /*yield*/, bcryptjs_1["default"].hash(newPassword, 10)];
            case 3:
                _b.password = _c.sent();
                _c.label = 4;
            case 4: return [4 /*yield*/, prisma.user.update({
                    where: { id: req.user.id },
                    data: updateData,
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        photoUrl: true,
                        role: true
                    }
                })];
            case 5:
                updatedUser = _c.sent();
                res.json(updatedUser);
                return [3 /*break*/, 7];
            case 6:
                error_2 = _c.sent();
                res.status(400).json({ error: 'Update failed' });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.uploadPhoto = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var photoUrl, updatedUser, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (!req.file) {
                    res.status(400).json({ error: 'No file uploaded' });
                    return [2 /*return*/];
                }
                photoUrl = "/uploads/" + req.file.filename;
                return [4 /*yield*/, prisma.user.update({
                        where: { id: req.user.id },
                        data: { photoUrl: photoUrl },
                        select: {
                            id: true,
                            photoUrl: true
                        }
                    })];
            case 1:
                updatedUser = _a.sent();
                res.json(updatedUser);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                res.status(400).json({ error: 'Upload failed' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAllUsers = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var users, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma.user.findMany({
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            photoUrl: true,
                            role: true,
                            isVerified: true,
                            createdAt: true
                        }
                    })];
            case 1:
                users = _a.sent();
                res.json(users);
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                res.status(400).json({ error: 'Failed to fetch users' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateUserRole = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var userId, role, updatedUser, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.params.userId;
                role = req.body.role;
                return [4 /*yield*/, prisma.user.update({
                        where: { id: userId },
                        data: { role: role },
                        select: {
                            id: true,
                            email: true,
                            role: true
                        }
                    })];
            case 1:
                updatedUser = _a.sent();
                res.json(updatedUser);
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                res.status(400).json({ error: 'Role update failed' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteUser = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var userId, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.params.userId;
                return [4 /*yield*/, prisma.user["delete"]({
                        where: { id: userId }
                    })];
            case 1:
                _a.sent();
                res.json({ message: 'User deleted successfully' });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                res.status(400).json({ error: 'Delete failed' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
