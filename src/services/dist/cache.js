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
exports.cacheService = exports.CacheService = void 0;
var redis_1 = require("./redis");
var CacheService = /** @class */ (function () {
    function CacheService() {
        this.DEFAULT_TTL = 3600; // 1 hour
        this.VERSION_KEY = 'cache:version';
        this.currentVersion = null;
        this.initializeVersion();
    }
    CacheService.prototype.initializeVersion = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, redis_1.redisService.get(this.VERSION_KEY)];
                    case 1:
                        _a.currentVersion = (_b.sent()) || '1';
                        return [2 /*return*/];
                }
            });
        });
    };
    CacheService.prototype.get = function (key, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, Promise, function () {
            var fullKey, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fullKey = this.buildKey(key, options);
                        return [4 /*yield*/, redis_1.redisService.get(fullKey)];
                    case 1:
                        data = _a.sent();
                        if (!data)
                            return [2 /*return*/, null];
                        return [2 /*return*/, options.useCompression
                                ? this.decompress(data)
                                : JSON.parse(data)];
                }
            });
        });
    };
    CacheService.prototype.set = function (key, data, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var fullKey, value, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        fullKey = this.buildKey(key, options);
                        if (!options.useCompression) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.compress(data)];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = JSON.stringify(data);
                        _b.label = 3;
                    case 3:
                        value = _a;
                        return [4 /*yield*/, redis_1.redisService.set(fullKey, value, options.ttl || this.DEFAULT_TTL)];
                    case 4:
                        _b.sent();
                        if (!options.invalidateOn) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.setInvalidationTriggers(fullKey, options.invalidateOn)];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    CacheService.prototype.invalidate = function (pattern) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, redis_1.redisService.invalidatePattern(pattern)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.incrementVersion()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CacheService.prototype.invalidateMultiple = function (patterns) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(__spreadArrays(patterns.map(function (pattern) { return redis_1.redisService.invalidatePattern(pattern); }), [
                            this.incrementVersion()
                        ]))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CacheService.prototype.buildKey = function (key, options) {
        var parts = [
            options.namespace,
            key,
            options.useVersioning ? this.currentVersion : null
        ].filter(Boolean);
        return parts.join(':');
    };
    CacheService.prototype.setInvalidationTriggers = function (key, triggers) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(triggers.map(function (trigger) {
                            return redis_1.redisService.addToSet("invalidation:" + trigger, key);
                        }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CacheService.prototype.incrementVersion = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.currentVersion = (parseInt(this.currentVersion) + 1).toString();
                        return [4 /*yield*/, redis_1.redisService.set(this.VERSION_KEY, this.currentVersion)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CacheService.prototype.compress = function (data) {
        return __awaiter(this, void 0, Promise, function () {
            var compress, promisify, compressAsync, buffer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('zlib'); })];
                    case 1:
                        compress = (_a.sent()).compress;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('util'); })];
                    case 2:
                        promisify = (_a.sent()).promisify;
                        compressAsync = promisify(compress);
                        return [4 /*yield*/, compressAsync(Buffer.from(JSON.stringify(data)))];
                    case 3:
                        buffer = _a.sent();
                        return [2 /*return*/, buffer.toString('base64')];
                }
            });
        });
    };
    CacheService.prototype.decompress = function (data) {
        return __awaiter(this, void 0, Promise, function () {
            var decompress, promisify, decompressAsync, buffer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('zlib'); })];
                    case 1:
                        decompress = (_a.sent()).decompress;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('util'); })];
                    case 2:
                        promisify = (_a.sent()).promisify;
                        decompressAsync = promisify(decompress);
                        return [4 /*yield*/, decompressAsync(Buffer.from(data, 'base64'))];
                    case 3:
                        buffer = _a.sent();
                        return [2 /*return*/, JSON.parse(buffer.toString())];
                }
            });
        });
    };
    CacheService.prototype.mget = function (keys, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var fullKeys, values;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fullKeys = keys.map(function (key) { return _this.buildKey(key, options); });
                        return [4 /*yield*/, redis_1.redisService.mget(fullKeys)];
                    case 1:
                        values = _a.sent();
                        return [2 /*return*/, values.map(function (value) {
                                return value ? (options.useCompression ? _this.decompress(value) : JSON.parse(value)) : null;
                            })];
                }
            });
        });
    };
    CacheService.prototype.mset = function (items, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var entries;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(items.map(function (item) { return __awaiter(_this, void 0, void 0, function () {
                            var _a, _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _a = {
                                            key: this.buildKey(item.key, options)
                                        };
                                        if (!options.useCompression) return [3 /*break*/, 2];
                                        return [4 /*yield*/, this.compress(item.value)];
                                    case 1:
                                        _b = _c.sent();
                                        return [3 /*break*/, 3];
                                    case 2:
                                        _b = JSON.stringify(item.value);
                                        _c.label = 3;
                                    case 3: return [2 /*return*/, (_a.value = _b,
                                            _a)];
                                }
                            });
                        }); }))];
                    case 1:
                        entries = _a.sent();
                        return [4 /*yield*/, redis_1.redisService.mset(entries, options.ttl || this.DEFAULT_TTL)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return CacheService;
}());
exports.CacheService = CacheService;
exports.cacheService = new CacheService();
