"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.notificationService = exports.NotificationService = void 0;
var redis_1 = require("./redis");
var client_1 = require("@prisma/client");
var events_1 = require("events");
var wsService_1 = require("./wsService");
var NotificationService = /** @class */ (function (_super) {
    __extends(NotificationService, _super);
    function NotificationService(ws) {
        var _this = _super.call(this) || this;
        _this.NOTIFICATION_TTL = 86400; // 24 hours
        _this.MAX_RECENT_NOTIFICATIONS = 1000;
        _this.ws = ws;
        _this.prisma = new client_1.PrismaClient();
        _this.setupEventHandlers();
        return _this;
    }
    NotificationService.prototype.setupEventHandlers = function () {
        this.on('notification', this.handleNotification.bind(this));
        this.on('error', this.handleError.bind(this));
    };
    NotificationService.prototype.handleNotification = function (notification) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.storeNotification(notification)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.broadcastNotification(notification)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.processNotificationSideEffects(notification)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        this.emit('error', error_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.prototype.handleError = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.error('Notification Error:', error);
                        return [4 /*yield*/, this.notifySystemAlert({
                                type: 'ERROR',
                                message: 'Notification system error',
                                details: error.message
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.prototype.notifyObjectChange = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var notification;
            return __generator(this, function (_a) {
                notification = __assign(__assign({ type: 'OBJECT_CHANGE' }, data), { timestamp: new Date() });
                this.emit('notification', notification);
                return [2 /*return*/];
            });
        });
    };
    NotificationService.prototype.notifyBatchOperation = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var notification;
            return __generator(this, function (_a) {
                notification = __assign(__assign({ type: 'BATCH_OPERATION' }, data), { timestamp: new Date() });
                this.emit('notification', notification);
                return [2 /*return*/];
            });
        });
    };
    NotificationService.prototype.notifySystemAlert = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var notification;
            return __generator(this, function (_a) {
                notification = __assign(__assign({}, data), { type: 'SYSTEM_ALERT', timestamp: new Date() });
                this.emit('notification', notification);
                return [2 /*return*/];
            });
        });
    };
    NotificationService.prototype.storeNotification = function (notification) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = "notification:" + Date.now() + ":" + Math.random().toString(36);
                        return [4 /*yield*/, Promise.all([
                                redis_1.redisService.set(key, notification, this.NOTIFICATION_TTL),
                                redis_1.redisService.addToSortedSet('recent_notifications', notification.timestamp.getTime(), key),
                                this.pruneOldNotifications()
                            ])];
                    case 1:
                        _a.sent();
                        // Store in database for permanent record
                        return [4 /*yield*/, this.prisma.notification.create({
                                data: {
                                    type: notification.type,
                                    userId: notification.userId,
                                    details: notification,
                                    createdAt: notification.timestamp
                                }
                            })];
                    case 2:
                        // Store in database for permanent record
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.prototype.broadcastNotification = function (notification) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (notification.type) {
                    case 'OBJECT_CHANGE':
                        this.ws.notifyObjectUpdate(notification.details.roomId, notification);
                        break;
                    case 'BATCH_OPERATION':
                        this.ws.notifyBatchUpdate(notification);
                        break;
                    case 'SYSTEM_ALERT':
                        this.ws.notifySystemAlert(notification);
                        break;
                }
                return [2 /*return*/];
            });
        });
    };
    NotificationService.prototype.processNotificationSideEffects = function (notification) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(notification.type === 'OBJECT_CHANGE' && notification.action === 'DELETE')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.handleObjectDeletion(notification)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.prototype.handleObjectDeletion = function (notification) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Cleanup related data
                    return [4 /*yield*/, Promise.all([
                            redis_1.redisService.invalidatePattern("object:" + notification.objectId + ":*"),
                            this.prisma.history.updateMany({
                                where: { objectId: notification.objectId },
                                data: { isActive: false }
                            })
                        ])];
                    case 1:
                        // Cleanup related data
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.prototype.pruneOldNotifications = function () {
        return __awaiter(this, void 0, void 0, function () {
            var count, toRemove;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, redis_1.redisService.sortedSetCount('recent_notifications')];
                    case 1:
                        count = _a.sent();
                        if (!(count > this.MAX_RECENT_NOTIFICATIONS)) return [3 /*break*/, 3];
                        toRemove = count - this.MAX_RECENT_NOTIFICATIONS;
                        return [4 /*yield*/, redis_1.redisService.removeOldestFromSortedSet('recent_notifications', toRemove)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.prototype.getRecentNotifications = function (limit) {
        if (limit === void 0) { limit = 50; }
        return __awaiter(this, void 0, void 0, function () {
            var keys, notifications;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, redis_1.redisService.getRecentFromSortedSet('recent_notifications', limit)];
                    case 1:
                        keys = _a.sent();
                        return [4 /*yield*/, Promise.all(keys.map(function (key) { return redis_1.redisService.get(key); }))];
                    case 2:
                        notifications = _a.sent();
                        return [2 /*return*/, notifications.filter(Boolean)];
                }
            });
        });
    };
    NotificationService.prototype.getUserNotifications = function (userId, limit) {
        if (limit === void 0) { limit = 50; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.prisma.notification.findMany({
                        where: { userId: userId },
                        orderBy: { createdAt: 'desc' },
                        take: limit
                    })];
            });
        });
    };
    return NotificationService;
}(events_1.EventEmitter));
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService(wsService_1.getWebSocketService());
