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
exports.WebSocketService = void 0;
var socket_io_1 = require("socket.io");
var jsonwebtoken_1 = require("jsonwebtoken");
var redis_1 = require("./redis");
var WebSocketService = /** @class */ (function () {
    function WebSocketService(server) {
        this.userSessions = new Map(); // userId -> Set of socketIds
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                methods: ['GET', 'POST']
            }
        });
        this.setupMiddleware();
        this.setupEventHandlers();
    }
    WebSocketService.prototype.setupMiddleware = function () {
        var _this = this;
        this.io.use(function (socket, next) { return __awaiter(_this, void 0, void 0, function () {
            var token, decoded;
            return __generator(this, function (_a) {
                try {
                    token = socket.handshake.auth.token;
                    if (!token)
                        throw new Error('Authentication required');
                    decoded = jsonwebtoken_1["default"].verify(token, process.env.JWT_SECRET);
                    socket.data.userId = decoded.userId;
                    // Store user session
                    if (!this.userSessions.has(decoded.userId)) {
                        this.userSessions.set(decoded.userId, new Set());
                    }
                    this.userSessions.get(decoded.userId).add(socket.id);
                    next();
                }
                catch (err) {
                    next(new Error('Authentication failed'));
                }
                return [2 /*return*/];
            });
        }); });
    };
    WebSocketService.prototype.setupEventHandlers = function () {
        var _this = this;
        this.io.on('connection', function (socket) {
            console.log('Client connected:', socket.id);
            // Room subscription
            socket.on('subscribe-room', function (roomId) {
                socket.join("room:" + roomId);
                _this.notifyRoomSubscription(roomId, socket.data.userId, true);
            });
            socket.on('unsubscribe-room', function (roomId) {
                socket.leave("room:" + roomId);
                _this.notifyRoomSubscription(roomId, socket.data.userId, false);
            });
            // Real-time object tracking
            socket.on('track-object', function (objectId) {
                socket.join("object:" + objectId);
            });
            socket.on('untrack-object', function (objectId) {
                socket.leave("object:" + objectId);
            });
            // User presence
            socket.on('set-status', function (status) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, redis_1.redisService.set("user:status:" + socket.data.userId, status)];
                        case 1:
                            _a.sent();
                            this.broadcastUserStatus(socket.data.userId, status);
                            return [2 /*return*/];
                    }
                });
            }); });
            socket.on('disconnect', function () {
                _this.handleDisconnect(socket);
            });
        });
    };
    WebSocketService.prototype.handleDisconnect = function (socket) {
        return __awaiter(this, void 0, void 0, function () {
            var userId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userId = socket.data.userId;
                        if (!(userId && this.userSessions.has(userId))) return [3 /*break*/, 2];
                        this.userSessions.get(userId)["delete"](socket.id);
                        if (!(this.userSessions.get(userId).size === 0)) return [3 /*break*/, 2];
                        this.userSessions["delete"](userId);
                        return [4 /*yield*/, redis_1.redisService.set("user:status:" + userId, 'offline')];
                    case 1:
                        _a.sent();
                        this.broadcastUserStatus(userId, 'offline');
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    // Notification methods
    WebSocketService.prototype.notifyObjectUpdate = function (objectId, data) {
        this.io.to("object:" + objectId).emit('object-updated', data);
        this.invalidateCache("object:" + objectId);
    };
    WebSocketService.prototype.notifyObjectMove = function (fromRoomId, toRoomId, data) {
        this.io.to("room:" + fromRoomId).emit('object-removed', data);
        this.io.to("room:" + toRoomId).emit('object-added', data);
        this.invalidateCache("room:" + fromRoomId);
        this.invalidateCache("room:" + toRoomId);
    };
    WebSocketService.prototype.notifyRoomUpdate = function (roomId, data) {
        this.io.to("room:" + roomId).emit('room-updated', data);
        this.invalidateCache("room:" + roomId);
    };
    WebSocketService.prototype.notifyHistoryUpdate = function (data) {
        this.io.emit('history-updated', data);
        this.invalidateCache('history:*');
    };
    WebSocketService.prototype.notifyRoomSubscription = function (roomId, userId, joined) {
        this.io.to("room:" + roomId).emit('room-presence', {
            roomId: roomId,
            userId: userId,
            action: joined ? 'joined' : 'left',
            timestamp: new Date()
        });
    };
    WebSocketService.prototype.broadcastUserStatus = function (userId, status) {
        this.io.emit('user-status', {
            userId: userId,
            status: status,
            timestamp: new Date()
        });
    };
    WebSocketService.prototype.invalidateCache = function (pattern) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, redis_1.redisService.invalidatePattern(pattern)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    WebSocketService.prototype.notifyBatchUpdate = function (notification) {
        this.broadcast('batch_update', notification);
    };
    WebSocketService.prototype.broadcast = function (event, data) {
        if (!this.io)
            return;
        this.io.emit(event, data);
    };
    WebSocketService.prototype.notifySystemAlert = function (notification) {
        this.broadcast('system_alert', notification);
    };
    return WebSocketService;
}());
exports.WebSocketService = WebSocketService;
