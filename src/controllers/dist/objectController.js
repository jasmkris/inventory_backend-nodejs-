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
exports.getObjectHistory = exports.transitObject = exports.createVariant = exports.moveObject = exports.deleteObject = exports.updateObject = exports.getObjectById = exports.createObject = void 0;
var client_1 = require("@prisma/client");
var wsService_1 = require("../services/wsService");
var prisma = new client_1.PrismaClient();
exports.createObject = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var _a, name, category, quantity, roomId, description, room, object, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, name = _a.name, category = _a.category, quantity = _a.quantity, roomId = _a.roomId, description = _a.description;
                return [4 /*yield*/, prisma.room.findUnique({
                        where: { id: roomId }
                    })];
            case 1:
                room = _b.sent();
                if (!room) {
                    res.status(404).json({ error: 'Room not found' });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, prisma.object.create({
                        data: {
                            name: name,
                            category: category,
                            quantity: quantity,
                            description: description,
                            roomId: roomId,
                            history: {
                                create: {
                                    action: 'CREATE',
                                    userId: req.user.id,
                                    details: 'Object created'
                                }
                            }
                        },
                        include: {
                            room: true,
                            history: {
                                take: 1,
                                orderBy: { createdAt: 'desc' }
                            }
                        }
                    })];
            case 2:
                object = _b.sent();
                res.status(201).json(object);
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                res.status(400).json({ error: 'Failed to create object' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getObjectById = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var objectId, object, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                objectId = req.params.objectId;
                return [4 /*yield*/, prisma.object.findUnique({
                        where: { id: objectId },
                        include: {
                            room: true,
                            parent: true,
                            variants: true,
                            history: {
                                take: 1,
                                orderBy: { createdAt: 'desc' }
                            }
                        }
                    })];
            case 1:
                object = _a.sent();
                if (!object) {
                    res.status(404).json({ error: 'Object not found' });
                    return [2 /*return*/];
                }
                res.json(object);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                res.status(500).json({ error: 'Failed to fetch object' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateObject = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var objectId, _a, name, category, quantity, description, object, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                objectId = req.params.objectId;
                _a = req.body, name = _a.name, category = _a.category, quantity = _a.quantity, description = _a.description;
                return [4 /*yield*/, prisma.object.update({
                        where: { id: objectId },
                        data: {
                            name: name,
                            category: category,
                            quantity: quantity,
                            description: description,
                            history: {
                                create: {
                                    action: 'UPDATE',
                                    userId: req.user.id,
                                    details: 'Object updated'
                                }
                            }
                        },
                        include: {
                            room: true,
                            history: {
                                take: 1,
                                orderBy: { createdAt: 'desc' }
                            }
                        }
                    })];
            case 1:
                object = _b.sent();
                res.json(object);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _b.sent();
                res.status(500).json({ error: 'Server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteObject = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var objectId, reason, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                objectId = req.params.objectId;
                reason = req.body.reason;
                // Create final history entry before deletion
                return [4 /*yield*/, prisma.history.create({
                        data: {
                            objectId: objectId,
                            userId: req.user.id,
                            action: 'DELETE',
                            details: reason || 'Object deleted'
                        }
                    })];
            case 1:
                // Create final history entry before deletion
                _a.sent();
                return [4 /*yield*/, prisma.object["delete"]({
                        where: { id: objectId }
                    })];
            case 2:
                _a.sent();
                res.json({ message: 'Object deleted successfully' });
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                res.status(500).json({ error: 'Server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.moveObject = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var objectId, _a, roomId, reason, room, object, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                objectId = req.params.objectId;
                _a = req.body, roomId = _a.roomId, reason = _a.reason;
                return [4 /*yield*/, prisma.room.findUnique({
                        where: { id: roomId }
                    })];
            case 1:
                room = _b.sent();
                if (!room) {
                    res.status(404).json({ error: 'Target room not found' });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, prisma.object.update({
                        where: { id: objectId },
                        data: {
                            roomId: roomId,
                            history: {
                                create: {
                                    action: 'MOVE',
                                    userId: req.user.id,
                                    details: reason || "Moved to " + room.name
                                }
                            }
                        },
                        include: {
                            room: true,
                            history: {
                                take: 1,
                                orderBy: { createdAt: 'desc' }
                            }
                        }
                    })];
            case 2:
                object = _b.sent();
                res.json(object);
                return [3 /*break*/, 4];
            case 3:
                error_5 = _b.sent();
                res.status(400).json({ error: 'Failed to move object' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.createVariant = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var originalObjectId, _a, name, description, quantity, roomId, category, originalObject, variant, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                originalObjectId = req.params.originalObjectId;
                _a = req.body, name = _a.name, description = _a.description, quantity = _a.quantity, roomId = _a.roomId, category = _a.category;
                return [4 /*yield*/, prisma.object.findUnique({
                        where: { id: originalObjectId },
                        include: { variants: true }
                    })];
            case 1:
                originalObject = _b.sent();
                if (!originalObject) {
                    res.status(404).json({ error: 'Original object not found' });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, prisma.object.create({
                        data: {
                            name: name || originalObject.name,
                            description: description || originalObject.description,
                            quantity: quantity,
                            roomId: roomId,
                            category: category || originalObject.category,
                            parentId: originalObjectId,
                            history: {
                                create: {
                                    action: 'CREATE',
                                    userId: req.user.id,
                                    details: "Created as variant of " + originalObject.name
                                }
                            }
                        }
                    })];
            case 2:
                variant = _b.sent();
                // Notify via WebSocket
                wsService_1["default"].getInstance().notifyObjectUpdate(roomId, {
                    action: 'VARIANT_CREATED',
                    object: variant
                });
                res.status(201).json(variant);
                return [3 /*break*/, 4];
            case 3:
                error_6 = _b.sent();
                res.status(400).json({ error: 'Failed to create variant' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.transitObject = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var objectId, reason, transitRoom, object, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                objectId = req.params.objectId;
                reason = req.body.reason;
                return [4 /*yield*/, prisma.room.findFirst({
                        where: { isTransit: true }
                    })];
            case 1:
                transitRoom = _a.sent();
                if (!transitRoom) {
                    res.status(404).json({ error: 'Transit room not found' });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, prisma.object.update({
                        where: { id: objectId },
                        data: {
                            roomId: transitRoom.id,
                            history: {
                                create: {
                                    action: 'TRANSIT',
                                    userId: req.user.id,
                                    details: reason
                                }
                            }
                        },
                        include: {
                            room: true,
                            history: {
                                take: 1,
                                orderBy: { createdAt: 'desc' }
                            }
                        }
                    })];
            case 2:
                object = _a.sent();
                res.json(object);
                return [3 /*break*/, 4];
            case 3:
                error_7 = _a.sent();
                res.status(400).json({ error: 'Failed to transit object' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getObjectHistory = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var objectId, history, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                objectId = req.params.objectId;
                return [4 /*yield*/, prisma.history.findMany({
                        where: { objectId: objectId },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' }
                    })];
            case 1:
                history = _a.sent();
                res.json(history);
                return [3 /*break*/, 3];
            case 2:
                error_8 = _a.sent();
                res.status(500).json({ error: 'Server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
