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
exports.getSearchSuggestions = exports.globalSearch = exports.searchRooms = exports.searchObjects = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var DEFAULT_PAGE_SIZE = 20;
exports.searchObjects = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var _a, q, category, roomId, status, minQuantity, maxQuantity, lastModified, _b, page, _c, limit, skip, where, date, _d, total, objects, result, error_1;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 2, , 3]);
                _a = req.query, q = _a.q, category = _a.category, roomId = _a.roomId, status = _a.status, minQuantity = _a.minQuantity, maxQuantity = _a.maxQuantity, lastModified = _a.lastModified, _b = _a.page, page = _b === void 0 ? '1' : _b, _c = _a.limit, limit = _c === void 0 ? String(DEFAULT_PAGE_SIZE) : _c;
                skip = (parseInt(page) - 1) * parseInt(limit);
                where = {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { description: { contains: q, mode: 'insensitive' } },
                        { tags: { hasSome: [q] } }
                    ]
                };
                if (category)
                    where.category = category;
                if (roomId)
                    where.roomId = roomId;
                if (status)
                    where.status = status;
                if (minQuantity)
                    where.quantity = { gte: parseInt(minQuantity) };
                if (maxQuantity)
                    where.quantity = __assign(__assign({}, where.quantity), { lte: parseInt(maxQuantity) });
                if (lastModified) {
                    date = new Date(lastModified);
                    where.updatedAt = { gte: date };
                }
                return [4 /*yield*/, Promise.all([
                        prisma.object.count({ where: where }),
                        prisma.object.findMany({
                            where: where,
                            include: {
                                room: true,
                                history: {
                                    take: 1,
                                    orderBy: { createdAt: 'desc' }
                                },
                                variants: {
                                    select: {
                                        id: true,
                                        name: true,
                                        roomId: true
                                    }
                                }
                            },
                            orderBy: { updatedAt: 'desc' },
                            skip: skip,
                            take: parseInt(limit)
                        })
                    ])];
            case 1:
                _d = _e.sent(), total = _d[0], objects = _d[1];
                result = {
                    data: objects,
                    pagination: {
                        total: total,
                        page: parseInt(page),
                        pageSize: parseInt(limit),
                        totalPages: Math.ceil(total / parseInt(limit))
                    }
                };
                res.json(result);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _e.sent();
                res.status(500).json({ error: 'Server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.searchRooms = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var _a, q, _b, page, _c, limit, skip, where, satisfies, , _d, total, rooms;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                try {
                    _a = req.query, q = _a.q, _b = _a.page, page = _b === void 0 ? '1' : _b, _c = _a.limit, limit = _c === void 0 ? String(DEFAULT_PAGE_SIZE) : _c;
                    skip = (parseInt(page) - 1) * parseInt(limit);
                    where = {
                        OR: [
                            {
                                name: {
                                    contains: q,
                                    mode: 'insensitive'
                                }
                            },
                            {
                                description: {
                                    contains: q,
                                    mode: 'insensitive'
                                }
                            }
                        ]
                    },  = (void 0).OR;
                    ({ name: { contains: string, mode: 'insensitive' } } | { description: { contains: string, mode: 'insensitive' } })[];
                }
                finally { }
                ;
                return [4 /*yield*/, Promise.all([
                        prisma.room.count({ where: where }),
                        prisma.room.findMany({
                            where: where,
                            include: {
                                _count: {
                                    select: { objects: true }
                                }
                            },
                            orderBy: { name: 'asc' },
                            skip: skip,
                            take: parseInt(limit)
                        })
                    ])];
            case 1:
                _d = _e.sent(), total = _d[0], rooms = _d[1];
                res.json({
                    data: rooms,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: total,
                        pages: Math.ceil(total / parseInt(limit))
                    }
                });
                return [2 /*return*/];
        }
    });
}); };
try { }
catch (error) {
    res.status(500).json({ error: 'Server error' });
}
;
exports.globalSearch = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var _a, q, _b, type, results, _c, _d, error_2;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 5, , 6]);
                _a = req.query, q = _a.q, _b = _a.type, type = _b === void 0 ? 'all' : _b;
                results = {};
                if (!(type === 'all' || type === 'object')) return [3 /*break*/, 2];
                _c = results;
                return [4 /*yield*/, prisma.object.findMany({
                        where: {
                            OR: [
                                { name: { contains: q, mode: 'insensitive' } },
                                { description: { contains: q, mode: 'insensitive' } }
                            ]
                        },
                        include: {
                            room: true
                        },
                        take: 5
                    })];
            case 1:
                _c.objects = _e.sent();
                _e.label = 2;
            case 2:
                if (!(type === 'all' || type === 'room')) return [3 /*break*/, 4];
                _d = results;
                return [4 /*yield*/, prisma.room.findMany({
                        where: {
                            OR: [
                                { name: { contains: q, mode: 'insensitive' } },
                                { description: { contains: q, mode: 'insensitive' } }
                            ]
                        },
                        include: {
                            _count: {
                                select: { objects: true }
                            }
                        },
                        take: 5
                    })];
            case 3:
                _d.rooms = _e.sent();
                _e.label = 4;
            case 4:
                res.json(results);
                return [3 /*break*/, 6];
            case 5:
                error_2 = _e.sent();
                res.status(500).json({ error: 'Server error' });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.getSearchSuggestions = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var _a, q, _b, type, suggestions, suggestions, error_3;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 5, , 6]);
                _a = req.query, q = _a.q, _b = _a.type, type = _b === void 0 ? 'object' : _b;
                if (!(type === 'object')) return [3 /*break*/, 2];
                return [4 /*yield*/, prisma.object.findMany({
                        where: {
                            name: { startsWith: q, mode: 'insensitive' }
                        },
                        select: {
                            name: true,
                            category: true
                        },
                        distinct: ['name'],
                        take: 5
                    })];
            case 1:
                suggestions = _c.sent();
                res.json(suggestions);
                return [3 /*break*/, 4];
            case 2: return [4 /*yield*/, prisma.room.findMany({
                    where: {
                        name: { startsWith: q, mode: 'insensitive' }
                    },
                    select: {
                        name: true
                    },
                    take: 5
                })];
            case 3:
                suggestions = _c.sent();
                res.json(suggestions);
                _c.label = 4;
            case 4: return [3 /*break*/, 6];
            case 5:
                error_3 = _c.sent();
                res.status(500).json({ error: 'Server error' });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
