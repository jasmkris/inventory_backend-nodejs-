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
exports.searchService = exports.SearchService = void 0;
var client_1 = require("@prisma/client");
var redis_1 = require("./redis");
var fuse_js_1 = require("fuse.js");
var elasticsearch_1 = require("./elasticsearch");
var SearchService = /** @class */ (function () {
    function SearchService() {
        this.CACHE_TTL = 300; // 5 minutes
        this.prisma = new client_1.PrismaClient();
        this.elastic = new elasticsearch_1.ElasticsearchService();
    }
    SearchService.prototype.search = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, results, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cacheKey = "search:" + JSON.stringify(params);
                        return [4 /*yield*/, redis_1.redisService.get(cacheKey)];
                    case 1:
                        cached = _b.sent();
                        if (cached)
                            return [2 /*return*/, cached];
                        _a = params.searchStrategy;
                        switch (_a) {
                            case 'elastic': return [3 /*break*/, 2];
                            case 'fuzzy': return [3 /*break*/, 4];
                            case 'hybrid': return [3 /*break*/, 6];
                        }
                        return [3 /*break*/, 6];
                    case 2: return [4 /*yield*/, this.elasticSearch(params)];
                    case 3:
                        results = _b.sent();
                        return [3 /*break*/, 8];
                    case 4: return [4 /*yield*/, this.fuzzySearch(params)];
                    case 5:
                        results = _b.sent();
                        return [3 /*break*/, 8];
                    case 6: return [4 /*yield*/, this.hybridSearch(params)];
                    case 7:
                        results = _b.sent();
                        _b.label = 8;
                    case 8: return [4 /*yield*/, redis_1.redisService.set(cacheKey, results, this.CACHE_TTL)];
                    case 9:
                        _b.sent();
                        return [2 /*return*/, results];
                }
            });
        });
    };
    SearchService.prototype.hybridSearch = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, elasticResults, fuzzyResults, mergedResults;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.elasticSearch(params),
                            this.fuzzySearch(params)
                        ])];
                    case 1:
                        _a = _b.sent(), elasticResults = _a[0], fuzzyResults = _a[1];
                        mergedResults = this.mergeSearchResults(elasticResults, fuzzyResults);
                        return [2 /*return*/, this.applyFiltersAndPagination(mergedResults, params)];
                }
            });
        });
    };
    SearchService.prototype.fuzzySearch = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var query, filters, pagination, items, fuse, searchResults;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = params.query, filters = params.filters, pagination = params.pagination;
                        return [4 /*yield*/, this.getBaseData(filters)];
                    case 1:
                        items = _a.sent();
                        fuse = new fuse_js_1["default"](items, {
                            keys: ['name', 'description', 'tags', 'category'],
                            threshold: 0.3,
                            distance: 100,
                            includeScore: true,
                            useExtendedSearch: true,
                            ignoreLocation: true,
                            findAllMatches: true
                        });
                        searchResults = fuse.search(query);
                        return [2 /*return*/, this.processSearchResults(searchResults, pagination)];
                }
            });
        });
    };
    SearchService.prototype.elasticSearch = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var query, filters, pagination, esQuery, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = params.query, filters = params.filters, pagination = params.pagination;
                        esQuery = this.buildElasticsearchQuery(query, filters);
                        return [4 /*yield*/, this.elastic.search('objects', esQuery, pagination)];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, this.processElasticsearchResults(results)];
                }
            });
        });
    };
    SearchService.prototype.getBaseData = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.prisma.object.findMany({
                        where: this.buildDatabaseFilters(filters),
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
                                    status: true
                                }
                            }
                        }
                    })];
            });
        });
    };
    SearchService.prototype.buildDatabaseFilters = function (filters) {
        var _a;
        var where = {};
        if (filters.category)
            where.category = filters.category;
        if (filters.roomId)
            where.roomId = filters.roomId;
        if (filters.status)
            where.status = filters.status;
        if ((_a = filters.tags) === null || _a === void 0 ? void 0 : _a.length)
            where.tags = { hasEvery: filters.tags };
        if (filters.dateRange) {
            where.updatedAt = {
                gte: new Date(filters.dateRange.start),
                lte: new Date(filters.dateRange.end)
            };
        }
        if (filters.quantity) {
            where.quantity = {
                gte: filters.quantity.min,
                lte: filters.quantity.max
            };
        }
        return where;
    };
    SearchService.prototype.buildElasticsearchQuery = function (query, filters) {
        return {
            bool: {
                must: [
                    {
                        multi_match: {
                            query: query,
                            fields: ['name^3', 'description^2', 'tags'],
                            fuzziness: 'AUTO'
                        }
                    }
                ],
                filter: this.buildElasticsearchFilters(filters)
            }
        };
    };
    SearchService.prototype.processSearchResults = function (results, pagination) {
        return __awaiter(this, void 0, void 0, function () {
            var page, limit, start, end;
            return __generator(this, function (_a) {
                page = pagination.page, limit = pagination.limit;
                start = (page - 1) * limit;
                end = start + limit;
                return [2 /*return*/, {
                        data: results.slice(start, end).map(function (r) { return r.item; }),
                        pagination: {
                            total: results.length,
                            page: page,
                            pageSize: limit,
                            totalPages: Math.ceil(results.length / limit)
                        },
                        metadata: {
                            scores: results.map(function (r) { return r.score; })
                        }
                    }];
            });
        });
    };
    SearchService.prototype.getSuggestions = function (query, type) {
        if (type === void 0) { type = 'object'; }
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, suggestions, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cacheKey = "suggestions:" + type + ":" + query;
                        return [4 /*yield*/, redis_1.redisService.get(cacheKey)];
                    case 1:
                        cached = _b.sent();
                        if (cached)
                            return [2 /*return*/, cached];
                        _a = type;
                        switch (_a) {
                            case 'object': return [3 /*break*/, 2];
                            case 'room': return [3 /*break*/, 4];
                            case 'tag': return [3 /*break*/, 6];
                        }
                        return [3 /*break*/, 8];
                    case 2: return [4 /*yield*/, this.getObjectSuggestions(query)];
                    case 3:
                        suggestions = _b.sent();
                        return [3 /*break*/, 8];
                    case 4: return [4 /*yield*/, this.getRoomSuggestions(query)];
                    case 5:
                        suggestions = _b.sent();
                        return [3 /*break*/, 8];
                    case 6: return [4 /*yield*/, this.getTagSuggestions(query)];
                    case 7:
                        suggestions = _b.sent();
                        return [3 /*break*/, 8];
                    case 8: return [4 /*yield*/, redis_1.redisService.set(cacheKey, suggestions, 60)];
                    case 9:
                        _b.sent(); // Cache for 1 minute
                        return [2 /*return*/, suggestions];
                }
            });
        });
    };
    SearchService.prototype.getObjectSuggestions = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.prisma.object.findMany({
                        where: {
                            name: { startsWith: query, mode: 'insensitive' }
                        },
                        select: {
                            id: true,
                            name: true,
                            category: true
                        },
                        take: 10
                    })];
            });
        });
    };
    return SearchService;
}());
exports.SearchService = SearchService;
exports.searchService = new SearchService();
