"use strict";
//used ONLY by the TypeORM CLI for migrations.
//it manually loads env because NestJS is not yet initialized
//when running migration commands from the terminal.
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const path_1 = require("path");
const typeorm_1 = require("typeorm");
const dotenv = __importStar(require("dotenv"));
const isProd = process.env.NODE_ENV === 'production';
const rootDir = process.cwd();
//manually load environment variables based on the current environment
let envPath = (0, path_1.resolve)(rootDir, `.env.${process.env.NODE_ENV ?? 'development'}`);
//fallback for monorepo structure: check one level up if not found in current directory
if (!require('fs').existsSync(envPath)) {
    envPath = (0, path_1.resolve)(rootDir, '..', `.env.${process.env.NODE_ENV ?? 'development'}`);
}
dotenv.config({ path: envPath });
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    //logic to handle networking: Use 'localhost' when running commands from your terminal,
    //but use the environment variable (usually 'postgres') when running inside Docker.
    host: process.argv.includes('--isLocal') ? 'localhost' : (process.env.POSTGRES_HOST || 'localhost'),
    port: Number(process.env.POSTGRES_PORT || 5432),
    username: process.env.POSTGRES_USER || 'admin',
    password: process.env.POSTGRES_PASSWORD || 'admin',
    database: process.env.POSTGRES_DB || 'pet_adoption',
    entities: [
        (0, path_1.join)(rootDir, isProd ? 'dist/**/*.entity.js' : 'src/**/*.entity.ts')
    ],
    migrations: isProd
        ? [(0, path_1.join)(rootDir, 'dist/database/migrations/*.js')]
        : [(0, path_1.join)(rootDir, 'src/database/migrations/*.ts')],
    synchronize: false,
    logging: process.env.NODE_ENV !== 'production',
});
