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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.batchController = exports.BatchController = void 0;
var client_1 = require("@prisma/client");
var notification_1 = require("../services/notification");
var redis_1 = require("../services/redis");
var errors_1 = require("../utils/errors");
var prisma = new client_1.PrismaClient();
var BatchController = /** @class */ (function () {
    function BatchController() {
    }
    BatchController.prototype.validateObjects = function (tx, objectIds) {
        return __awaiter(this, void 0, void 0, function () {
            var objects, found_1, missing;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, tx.object.findMany({
                            where: { id: { "in": objectIds } },
                            include: { room: true }
                        })];
                    case 1:
                        objects = _a.sent();
                        if (objects.length !== objectIds.length) {
                            found_1 = new Set(objects.map(function (o) { return o.id; }));
                            missing = objectIds.filter(function (id) { return !found_1.has(id); });
                            throw new errors_1.ValidationError("Objects not found: " + missing.join(', '));
                        }
                        return [2 /*return*/, objects];
                }
            });
        });
    };
    BatchController.prototype.validateRoom = function (tx, roomId) {
        return __awaiter(this, void 0, void 0, function () {
            var room;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, tx.room.findUnique({
                            where: { id: roomId }
                        })];
                    case 1:
                        room = _a.sent();
                        if (!room) {
                            throw new errors_1.ValidationError("Room not found: " + roomId);
                        }
                        return [2 /*return*/, room];
                }
            });
        });
    };
    BatchController.prototype.executeBatchOperation = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var operation, userId, result, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        operation = req.body;
                        userId = req.user.id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                var objects, _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: return [4 /*yield*/, this.validateObjects(tx, operation.objectIds)];
                                        case 1:
                                            objects = _b.sent();
                                            _a = operation.action;
                                            switch (_a) {
                                                case 'MOVE': return [3 /*break*/, 2];
                                                case 'DELETE': return [3 /*break*/, 4];
                                                case 'TRANSIT': return [3 /*break*/, 6];
                                                case 'TAG': return [3 /*break*/, 8];
                                                case 'UPDATE_QUANTITY': return [3 /*break*/, 10];
                                                case 'ARCHIVE': return [3 /*break*/, 12];
                                            }
                                            return [3 /*break*/, 14];
                                        case 2: return [4 /*yield*/, this.batchMove(tx, objects, operation, userId)];
                                        case 3: return [2 /*return*/, _b.sent()];
                                        case 4: return [4 /*yield*/, this.batchDelete(tx, objects, operation, userId)];
                                        case 5: return [2 /*return*/, _b.sent()];
                                        case 6: return [4 /*yield*/, this.batchTransit(tx, objects, operation, userId)];
                                        case 7: return [2 /*return*/, _b.sent()];
                                        case 8: return [4 /*yield*/, this.batchTag(tx, objects, operation, userId)];
                                        case 9: return [2 /*return*/, _b.sent()];
                                        case 10: return [4 /*yield*/, this.batchUpdateQuantity(tx, objects, operation, userId)];
                                        case 11: return [2 /*return*/, _b.sent()];
                                        case 12: return [4 /*yield*/, this.batchArchive(tx, objects, operation, userId)];
                                        case 13: return [2 /*return*/, _b.sent()];
                                        case 14: throw new errors_1.ValidationError('Invalid batch operation');
                                    }
                                });
                            }); })];
                    case 2:
                        result = _a.sent();
                        // Invalidate relevant caches
                        return [4 /*yield*/, this.invalidateCaches(operation)];
                    case 3:
                        // Invalidate relevant caches
                        _a.sent();
                        // Notify about the batch operation
                        return [4 /*yield*/, notification_1.notificationService.notifyBatchOperation({
                                action: operation.action,
                                items: operation.objectIds,
                                userId: userId,
                                details: operation
                            })];
                    case 4:
                        // Notify about the batch operation
                        _a.sent();
                        res.json(result);
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        if (error_1 instanceof errors_1.ValidationError) {
                            res.status(400).json({ error: error_1.message });
                        }
                        else {
                            res.status(500).json({ error: 'Server error' });
                        }
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    BatchController.prototype.batchMove = function (tx, objects, operation, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var targetRoom;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.validateRoom(tx, operation.targetRoomId)];
                    case 1:
                        targetRoom = _a.sent();
                        return [2 /*return*/, Promise.all(objects.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                                var updated;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, tx.object.update({
                                                where: { id: obj.id },
                                                data: {
                                                    roomId: targetRoom.id,
                                                    updatedAt: new Date(),
                                                    status: 'MOVED'
                                                }
                                            })];
                                        case 1:
                                            updated = _a.sent();
                                            return [4 /*yield*/, tx.history.create({
                                                    data: {
                                                        objectId: obj.id,
                                                        userId: userId,
                                                        action: 'MOVE',
                                                        details: {
                                                            fromRoomId: obj.roomId,
                                                            toRoomId: targetRoom.id,
                                                            reason: operation.reason
                                                        }
                                                    }
                                                })];
                                        case 2:
                                            _a.sent();
                                            return [2 /*return*/, updated];
                                    }
                                });
                            }); }))];
                }
            });
        });
    };
    BatchController.prototype.batchDelete = function (tx, objects, operation, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var reason;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        reason = operation.reason;
                        // Create final history entries before deletion
                        return [4 /*yield*/, tx.history.createMany({
                                data: objects.map(function (obj) { return ({
                                    objectId: obj.id,
                                    userId: userId,
                                    action: 'DELETE',
                                    details: reason || 'Batch deletion'
                                }); })
                            })];
                    case 1:
                        // Create final history entries before deletion
                        _a.sent();
                        // Delete objects
                        return [4 /*yield*/, tx.object.deleteMany({
                                where: { id: { "in": objects.map(function (obj) { return obj.id; }) } }
                            })];
                    case 2:
                        // Delete objects
                        _a.sent();
                        return [2 /*return*/, { message: "Successfully deleted " + objects.length + " objects" }];
                }
            });
        });
    };
    BatchController.prototype.batchTransit = function (tx, objects, operation, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var transitRoom;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, tx.room.findFirst({
                            where: { isTransit: true }
                        })];
                    case 1:
                        transitRoom = _a.sent();
                        if (!transitRoom) {
                            throw new errors_1.ValidationError('Transit room not found');
                        }
                        // Move objects to transit room
                        return [4 /*yield*/, Promise.all(objects.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, tx.object.update({
                                                where: { id: obj.id },
                                                data: {
                                                    roomId: transitRoom.id,
                                                    status: 'IN_TRANSIT'
                                                }
                                            })];
                                        case 1:
                                            _a.sent();
                                            return [4 /*yield*/, tx.history.create({
                                                    data: {
                                                        objectId: obj.id,
                                                        userId: userId,
                                                        action: 'TRANSIT',
                                                        details: operation.reason || 'Moved to transit'
                                                    }
                                                })];
                                        case 2:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 2:
                        // Move objects to transit room
                        _a.sent();
                        return [2 /*return*/, { message: "Successfully moved " + objects.length + " objects to transit" }];
                }
            });
        });
    };
    BatchController.prototype.batchTag = function (tx, objects, operation, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, tags, _b, tagAction;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = operation.tags, tags = _a === void 0 ? [] : _a, _b = operation.action, tagAction = _b === void 0 ? 'ADD' : _b;
                        return [4 /*yield*/, Promise.all(objects.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                                var currentTags, newTags;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            currentTags = obj.tags || [];
                                            newTags = tagAction === 'ADD'
                                                ? __spreadArrays(new Set(__spreadArrays(currentTags, tags))) : currentTags.filter(function (t) { return !tags.includes(t); });
                                            return [4 /*yield*/, tx.object.update({
                                                    where: { id: obj.id },
                                                    data: { tags: newTags }
                                                })];
                                        case 1:
                                            _a.sent();
                                            return [4 /*yield*/, tx.history.create({
                                                    data: {
                                                        objectId: obj.id,
                                                        userId: userId,
                                                        action: 'TAG',
                                                        details: (tagAction === 'ADD' ? 'Added' : 'Removed') + " tags: " + tags.join(', ')
                                                    }
                                                })];
                                        case 2:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 1:
                        _c.sent();
                        return [2 /*return*/, { message: "Successfully " + tagAction.toLowerCase() + "ed tags to " + objects.length + " objects" }];
                }
            });
        });
    };
    BatchController.prototype.batchUpdateQuantity = function (tx, objects, operation, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var quantity;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        quantity = operation.quantity;
                        return [4 /*yield*/, Promise.all(objects.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, tx.object.update({
                                                where: { id: obj.id },
                                                data: { quantity: quantity }
                                            })];
                                        case 1:
                                            _a.sent();
                                            return [4 /*yield*/, tx.history.create({
                                                    data: {
                                                        objectId: obj.id,
                                                        userId: userId,
                                                        action: 'UPDATE_QUANTITY',
                                                        details: "Updated quantity to " + quantity
                                                    }
                                                })];
                                        case 2:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { message: "Successfully updated quantity for " + objects.length + " objects" }];
                }
            });
        });
    };
    BatchController.prototype.batchArchive = function (tx, objects, operation, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(objects.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, tx.object.update({
                                            where: { id: obj.id },
                                            data: { status: 'ARCHIVED' }
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, tx.history.create({
                                                data: {
                                                    objectId: obj.id,
                                                    userId: userId,
                                                    action: 'ARCHIVE',
                                                    details: operation.reason || 'Object archived'
                                                }
                                            })];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { message: "Successfully archived " + objects.length + " objects" }];
                }
            });
        });
    };
    // Similar implementations for other batch operations...
    BatchController.prototype.invalidateCaches = function (operation) {
        return __awaiter(this, void 0, void 0, function () {
            var patterns;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        patterns = new Set();
                        // Add relevant cache patterns based on operation
                        if (operation.targetRoomId) {
                            patterns.add("room:" + operation.targetRoomId + ":*");
                        }
                        operation.objectIds.forEach(function (id) {
                            patterns.add("object:" + id + ":*");
                        });
                        patterns.add('search:*');
                        patterns.add('recent:*');
                        // Invalidate all relevant patterns
                        return [4 /*yield*/, Promise.all(Array.from(patterns).map(function (pattern) { return redis_1.redisService.invalidatePattern(pattern); }))];
                    case 1:
                        // Invalidate all relevant patterns
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return BatchController;
}());
exports.BatchController = BatchController;
exports.batchController = new BatchController();
