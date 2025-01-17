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
exports.ElasticsearchService = void 0;
var elasticsearch_1 = require("@elastic/elasticsearch");
var ElasticsearchService = /** @class */ (function () {
    function ElasticsearchService() {
        this.client = new elasticsearch_1.Client({
            node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
            auth: {
                username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
                password: process.env.ELASTICSEARCH_PASSWORD || ''
            }
        });
    }
    ElasticsearchService.prototype.search = function (index, query, pagination) {
        return __awaiter(this, void 0, void 0, function () {
            var page, limit, from, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        page = pagination.page, limit = pagination.limit;
                        from = (page - 1) * limit;
                        return [4 /*yield*/, this.client.search({
                                index: index,
                                body: {
                                    from: from,
                                    size: limit,
                                    query: query
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, {
                                hits: response.hits.hits,
                                total: response.hits.total,
                                took: response.took
                            }];
                }
            });
        });
    };
    ElasticsearchService.prototype.index = function (index, document) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.client.index({
                        index: index,
                        body: document
                    })];
            });
        });
    };
    ElasticsearchService.prototype.bulk = function (operations) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.client.bulk({
                        refresh: true,
                        body: operations
                    })];
            });
        });
    };
    ElasticsearchService.prototype["delete"] = function (index, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.client["delete"]({
                        index: index,
                        id: id
                    })];
            });
        });
    };
    return ElasticsearchService;
}());
exports.ElasticsearchService = ElasticsearchService;
