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
// DTOs exports
__exportStar(require("./auth.dto"), exports);
__exportStar(require("./pet.dto"), exports);
__exportStar(require("./adoption.dto"), exports);
__exportStar(require("./adoption-request.dto"), exports);
__exportStar(require("./message.dto"), exports);
__exportStar(require("./notification.dto"), exports);
__exportStar(require("./adopter.dto"), exports);
__exportStar(require("./employee.dto"), exports);
__exportStar(require("./conversation.dto"), exports);
__exportStar(require("./supply.dto"), exports);
__exportStar(require("./medical-record.dto"), exports);
__exportStar(require("./file-upload.dto"), exports);
__exportStar(require("./supplier.dto"), exports);
__exportStar(require("./vaccination.dto"), exports);
__exportStar(require("./department.dto"), exports);
