"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('app', () => ({
    port: Number(process.env.PORT ?? 3000),
    version: process.env.APP_VERSION ?? process.env.npm_package_version ?? 'dev',
    nodeEnv: process.env.NODE_ENV ?? 'development',
}));
