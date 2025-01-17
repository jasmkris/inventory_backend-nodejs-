"use strict";
exports.__esModule = true;
exports.specs = void 0;
var swagger_jsdoc_1 = require("swagger-jsdoc");
var options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Inventory Management API',
            version: '1.0.0',
            description: 'API documentation for the Real-Time Inventory Management System'
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:5000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{
                bearerAuth: []
            }]
    },
    apis: ['./src/routes/*.ts']
};
exports.specs = swagger_jsdoc_1["default"](options);
