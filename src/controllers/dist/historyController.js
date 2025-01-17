"use strict";
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
exports.getHistoryStats = exports.getUserHistory = exports.getRoomHistory = exports.getGlobalHistory = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var DEFAULT_PAGE_SIZE = 20;
exports.getGlobalHistory = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, startDate, endDate, action, userId, roomId, _b, page, _c, limit, skip, where, total, history, error_1;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                _a = req.query, startDate = _a.startDate, endDate = _a.endDate, action = _a.action, userId = _a.userId, roomId = _a.roomId, _b = _a.page, page = _b === void 0 ? '1' : _b, _c = _a.limit, limit = _c === void 0 ? String(DEFAULT_PAGE_SIZE) : _c;
                skip = (parseInt(page) - 1) * parseInt(limit);
                where = {};
                if (startDate)
                    where.createdAt = { gte: new Date(startDate) };
                if (endDate)
                    where.createdAt = __assign(__assign({}, where.createdAt), { lte: new Date(endDate) });
                if (action)
                    where.action = action;
                if (userId)
                    where.userId = userId;
                if (roomId)
                    where.object = { roomId: roomId };
                return [4 /*yield*/, prisma.history.count({ where: where })];
            case 1:
                total = _d.sent();
                return [4 /*yield*/, prisma.history.findMany({
                        where: where,
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true
                                }
                            },
                            object: {
                                select: {
                                    id: true,
                                    name: true,
                                    room: {
                                        select: {
                                            id: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' },
                        skip: skip,
                        take: parseInt(limit)
                    })];
            case 2:
                history = _d.sent();
                res.json({
                    data: history,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: total,
                        pages: Math.ceil(total / parseInt(limit))
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _d.sent();
                res.status(500).json({ error: 'Server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getRoomHistory = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var roomId, _a, startDate, endDate, _b, page, _c, limit, skip, where, total, history, error_2;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                roomId = req.params.roomId;
                _a = req.query, startDate = _a.startDate, endDate = _a.endDate, _b = _a.page, page = _b === void 0 ? '1' : _b, _c = _a.limit, limit = _c === void 0 ? String(DEFAULT_PAGE_SIZE) : _c;
                skip = (parseInt(page) - 1) * parseInt(limit);
                where = {
                    object: { roomId: roomId }
                };
                if (startDate)
                    where.createdAt = { gte: new Date(startDate) };
                if (endDate)
                    where.createdAt = __assign(__assign({}, where.createdAt), { lte: new Date(endDate) });
                return [4 /*yield*/, prisma.history.count({ where: where })];
            case 1:
                total = _d.sent();
                return [4 /*yield*/, prisma.history.findMany({
                        where: where,
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true
                                }
                            },
                            object: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' },
                        skip: skip,
                        take: parseInt(limit)
                    })];
            case 2:
                history = _d.sent();
                res.json({
                    data: history,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: total,
                        pages: Math.ceil(total / parseInt(limit))
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _d.sent();
                res.status(500).json({ error: 'Server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getUserHistory = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, startDate, endDate, _b, page, _c, limit, skip, where, total, history, error_3;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                userId = req.params.userId;
                _a = req.query, startDate = _a.startDate, endDate = _a.endDate, _b = _a.page, page = _b === void 0 ? '1' : _b, _c = _a.limit, limit = _c === void 0 ? String(DEFAULT_PAGE_SIZE) : _c;
                skip = (parseInt(page) - 1) * parseInt(limit);
                where = { userId: userId };
                if (startDate)
                    where.createdAt = { gte: new Date(startDate) };
                if (endDate)
                    where.createdAt = __assign(__assign({}, where.createdAt), { lte: new Date(endDate) });
                return [4 /*yield*/, prisma.history.count({ where: where })];
            case 1:
                total = _d.sent();
                return [4 /*yield*/, prisma.history.findMany({
                        where: where,
                        include: {
                            object: {
                                select: {
                                    id: true,
                                    name: true,
                                    room: {
                                        select: {
                                            id: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' },
                        skip: skip,
                        take: parseInt(limit)
                    })];
            case 2:
                history = _d.sent();
                res.json({
                    data: history,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: total,
                        pages: Math.ceil(total / parseInt(limit))
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _d.sent();
                res.status(500).json({ error: 'Server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getHistoryStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var actionCounts, recentActivity, activeUsers, modifiedObjects, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, prisma.history.groupBy({
                        by: ['action'],
                        _count: true
                    })];
            case 1:
                actionCounts = _a.sent();
                return [4 /*yield*/, prisma.history.findMany({
                        take: 5,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true
                                }
                            },
                            object: {
                                select: {
                                    name: true,
                                    room: {
                                        select: { name: true }
                                    }
                                }
                            }
                        }
                    })];
            case 2:
                recentActivity = _a.sent();
                return [4 /*yield*/, prisma.history.groupBy({
                        by: ['userId'],
                        _count: true,
                        orderBy: {
                            _count: {
                                userId: 'desc'
                            }
                        },
                        take: 5
                    })];
            case 3:
                activeUsers = _a.sent();
                return [4 /*yield*/, prisma.history.groupBy({
                        by: ['objectId'],
                        _count: true,
                        orderBy: {
                            _count: {
                                objectId: 'desc'
                            }
                        },
                        take: 5
                    })];
            case 4:
                modifiedObjects = _a.sent();
                res.json({
                    actionCounts: actionCounts,
                    recentActivity: recentActivity,
                    activeUsers: activeUsers,
                    modifiedObjects: modifiedObjects
                });
                return [3 /*break*/, 6];
            case 5:
                error_4 = _a.sent();
                res.status(500).json({ error: 'Server error' });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
