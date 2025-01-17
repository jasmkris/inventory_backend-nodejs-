"use strict";
exports.__esModule = true;
var express_1 = require("express");
var cors_1 = require("cors");
var client_1 = require("@prisma/client");
var auth_routes_1 = require("./routes/auth.routes");
var user_routes_1 = require("./routes/user.routes");
var room_routes_1 = require("./routes/room.routes");
var object_routes_1 = require("./routes/object.routes");
var swagger_ui_express_1 = require("swagger-ui-express");
var swagger_1 = require("./config/swagger");
var wsService_1 = require("./services/wsService");
var search_routes_1 = require("./routes/search.routes");
var http_1 = require("http");
var prisma = new client_1.PrismaClient();
var app = express_1["default"]();
var server = http_1["default"].createServer(app);
// Initialize WebSocket before routes
wsService_1["default"].initialize(server);
// Middleware
app.use(cors_1["default"]());
app.use(express_1["default"].json());
app.use(express_1["default"].urlencoded({ extended: true }));
// Routes
app.use('/api/auth', auth_routes_1["default"]);
app.use('/api/users', user_routes_1["default"]);
app.use('/api/rooms', room_routes_1["default"]);
app.use('/api/objects', object_routes_1["default"]);
app.use('/api/search', search_routes_1["default"]);
// Swagger documentation
app.use('/api-docs', swagger_ui_express_1["default"].serve, swagger_ui_express_1["default"].setup(swagger_1.specs));
// Error handling
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
var PORT = process.env.PORT || 5000;
server.listen(PORT, function () {
    console.log("Server is running on port " + PORT);
});
exports["default"] = server;
