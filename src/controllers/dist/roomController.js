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
exports.deleteRoom = exports.updateRoom = exports.getRoomObjects = exports.getRoomById = exports.getAllRooms = exports.createRoom = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
exports.createRoom = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var _a, name, description, isTransit, existingRoom, room, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, name = _a.name, description = _a.description, isTransit = _a.isTransit;
                return [4 /*yield*/, prisma.room.findFirst({
                        where: { name: name }
                    })];
            case 1:
                existingRoom = _b.sent();
                if (existingRoom) {
                    res.status(400).json({ error: 'Room with this name already exists' });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, prisma.room.create({
                        data: {
                            name: name,
                            description: description,
                            isTransit: isTransit || false
                        }
                    })];
            case 2:
                room = _b.sent();
                res.status(201).json(room);
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                res.status(400).json({ error: 'Failed to create room' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getAllRooms = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var search, where, rooms, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                search = req.query.search;
                where = search ? {
                    OR: [
                        {
                            name: {
                                contains: search,
                                mode: 'insensitive'
                            }
                        },
                        {
                            description: {
                                contains: search,
                                mode: 'insensitive'
                            }
                        }
                    ]
                } : {};
                return [4 /*yield*/, prisma.room.findMany({
                        where: where,
                        include: {
                            _count: {
                                select: { objects: true }
                            }
                        }
                    })];
            case 1:
                rooms = _a.sent();
                res.json(rooms);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                res.status(500).json({ error: 'Failed to fetch rooms' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getRoomById = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var roomId, room, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                roomId = req.params.roomId;
                return [4 /*yield*/, prisma.room.findUnique({
                        where: { id: roomId },
                        include: {
                            _count: {
                                select: { objects: true }
                            }
                        }
                    })];
            case 1:
                room = _a.sent();
                if (!room) {
                    res.status(404).json({ error: 'Room not found' });
                    return [2 /*return*/];
                }
                res.json(room);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                res.status(500).json({ error: 'Failed to fetch room' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getRoomObjects = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var roomId, _a, search, category, where, objects, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                roomId = req.params.roomId;
                _a = req.query, search = _a.search, category = _a.category;
                where = __assign(__assign({ roomId: roomId }, (category ? { category: category } : {})), (search ? {
                    OR: [
                        {
                            name: {
                                contains: search,
                                mode: 'insensitive'
                            }
                        },
                        {
                            description: {
                                contains: search,
                                mode: 'insensitive'
                            }
                        }
                    ]
                } : {}));
                return [4 /*yield*/, prisma.object.findMany({
                        where: where,
                        include: {
                            room: true
                        }
                    })];
            case 1:
                objects = _b.sent();
                res.json(objects);
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                res.status(500).json({ error: 'Failed to fetch room objects' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateRoom = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var roomId, _a, name, description, isTransit, room, existingRoom, updatedRoom, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                roomId = req.params.roomId;
                _a = req.body, name = _a.name, description = _a.description, isTransit = _a.isTransit;
                return [4 /*yield*/, prisma.room.findUnique({
                        where: { id: roomId }
                    })];
            case 1:
                room = _b.sent();
                if (!room) {
                    res.status(404).json({ error: 'Room not found' });
                    return [2 /*return*/];
                }
                // Check if it's the transit room
                if (room.isTransit) {
                    res.status(400).json({ error: 'Cannot modify transit room' });
                    return [2 /*return*/];
                }
                if (!(name && name !== room.name)) return [3 /*break*/, 3];
                return [4 /*yield*/, prisma.room.findFirst({
                        where: { name: name }
                    })];
            case 2:
                existingRoom = _b.sent();
                if (existingRoom) {
                    res.status(400).json({ error: 'Room with this name already exists' });
                    return [2 /*return*/];
                }
                _b.label = 3;
            case 3: return [4 /*yield*/, prisma.room.update({
                    where: { id: roomId },
                    data: {
                        name: name,
                        description: description,
                        isTransit: isTransit
                    }
                })];
            case 4:
                updatedRoom = _b.sent();
                res.json(updatedRoom);
                return [3 /*break*/, 6];
            case 5:
                error_5 = _b.sent();
                res.status(400).json({ error: 'Failed to update room' });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.deleteRoom = function (req, res) { return __awaiter(void 0, void 0, Promise, function () {
    var roomId, room, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                roomId = req.params.roomId;
                return [4 /*yield*/, prisma.room.findUnique({
                        where: { id: roomId },
                        include: {
                            _count: {
                                select: { objects: true }
                            }
                        }
                    })];
            case 1:
                room = _a.sent();
                if (!room) {
                    res.status(404).json({ error: 'Room not found' });
                    return [2 /*return*/];
                }
                if (room.isTransit) {
                    res.status(400).json({ error: 'Cannot delete transit room' });
                    return [2 /*return*/];
                }
                // Check if room has objects
                if (room._count.objects > 0) {
                    res.status(400).json({
                        error: 'Cannot delete room with objects. Please move or delete objects first.'
                    });
                    return [2 /*return*/];
                }
                // Delete room
                return [4 /*yield*/, prisma.room["delete"]({
                        where: { id: roomId }
                    })];
            case 2:
                // Delete room
                _a.sent();
                res.json({ message: 'Room deleted successfully' });
                return [3 /*break*/, 4];
            case 3:
                error_6 = _a.sent();
                res.status(400).json({ error: 'Failed to delete room' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
