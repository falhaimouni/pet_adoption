"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AppService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const config_1 = require("./config");
let AppService = AppService_1 = class AppService {
    constructor(dataSource, app) {
        this.dataSource = dataSource;
        this.app = app;
        this.logger = new common_1.Logger(AppService_1.name);
    }
    getStatus() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: this.app.version,
            nodeEnv: this.app.nodeEnv,
        };
    }
    getVersion() {
        return this.app.version;
    }
    async checkDb() {
        if (!this.dataSource) {
            return { ok: false, message: 'no datasource configured' };
        }
        try {
            await this.dataSource.query('SELECT 1');
            return { ok: true };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.warn('DB readiness check failed: ' + msg);
            return { ok: false, message: msg };
        }
    }
};
exports.AppService = AppService;
exports.AppService = AppService = AppService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(config_1.appConfig.KEY)),
    __metadata("design:paramtypes", [typeorm_1.DataSource, void 0])
], AppService);
