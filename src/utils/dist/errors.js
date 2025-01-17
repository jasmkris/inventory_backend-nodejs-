"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.handleError = exports.DatabaseError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.ValidationError = void 0;
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'ValidationError';
        return _this;
    }
    return ValidationError;
}(Error));
exports.ValidationError = ValidationError;
var AuthorizationError = /** @class */ (function (_super) {
    __extends(AuthorizationError, _super);
    function AuthorizationError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'AuthorizationError';
        return _this;
    }
    return AuthorizationError;
}(Error));
exports.AuthorizationError = AuthorizationError;
var NotFoundError = /** @class */ (function (_super) {
    __extends(NotFoundError, _super);
    function NotFoundError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'NotFoundError';
        return _this;
    }
    return NotFoundError;
}(Error));
exports.NotFoundError = NotFoundError;
var ConflictError = /** @class */ (function (_super) {
    __extends(ConflictError, _super);
    function ConflictError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'ConflictError';
        return _this;
    }
    return ConflictError;
}(Error));
exports.ConflictError = ConflictError;
var DatabaseError = /** @class */ (function (_super) {
    __extends(DatabaseError, _super);
    function DatabaseError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'DatabaseError';
        return _this;
    }
    return DatabaseError;
}(Error));
exports.DatabaseError = DatabaseError;
// Helper function to handle common error scenarios
exports.handleError = function (error) {
    if (error instanceof ValidationError) {
        return { status: 400, message: error.message };
    }
    if (error instanceof AuthorizationError) {
        return { status: 403, message: error.message };
    }
    if (error instanceof NotFoundError) {
        return { status: 404, message: error.message };
    }
    if (error instanceof ConflictError) {
        return { status: 409, message: error.message };
    }
    if (error instanceof DatabaseError) {
        return { status: 500, message: 'Database operation failed' };
    }
    // Default error handling
    console.error('Unhandled error:', error);
    return { status: 500, message: 'Internal server error' };
};
