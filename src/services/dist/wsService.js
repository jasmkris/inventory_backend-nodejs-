"use strict";
exports.__esModule = true;
exports.getWebSocketService = exports.initializeWebSocket = void 0;
var websocket_1 = require("./websocket");
var instance = null;
exports.initializeWebSocket = function (server) {
    if (!instance) {
        instance = new websocket_1.WebSocketService(server);
    }
    return instance;
};
exports.getWebSocketService = function () {
    if (!instance) {
        throw new Error('WebSocket service not initialized');
    }
    return instance;
};
exports["default"] = {
    initialize: exports.initializeWebSocket,
    getInstance: exports.getWebSocketService
};
