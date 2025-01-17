"use strict";
exports.__esModule = true;
exports.upload = void 0;
var multer_1 = require("multer");
var path_1 = require("path");
var storage = multer_1["default"].diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.env.UPLOAD_PATH || 'uploads/');
    },
    filename: function (req, file, cb) {
        var uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path_1["default"].extname(file.originalname));
    }
});
var fileFilter = function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};
exports.upload = multer_1["default"]({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});
