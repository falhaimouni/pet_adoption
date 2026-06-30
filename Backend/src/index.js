"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = exports.AppModule = void 0;
var app_module_1 = require("./app.module");
Object.defineProperty(exports, "AppModule", { enumerable: true, get: function () { return app_module_1.AppModule; } });
var database_module_1 = require("./database/database.module");
Object.defineProperty(exports, "DatabaseModule", { enumerable: true, get: function () { return database_module_1.DatabaseModule; } });
__exportStar(require("./database/entities"), exports);
