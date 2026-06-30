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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Supply = void 0;
const typeorm_1 = require("typeorm");
const supplier_supply_entity_1 = require("./supplier-supply.entity");
let Supply = class Supply {
};
exports.Supply = Supply;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'supply_id' }),
    __metadata("design:type", String)
], Supply.prototype, "supplyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'supply_name', type: 'varchar', length: 160 }),
    __metadata("design:type", String)
], Supply.prototype, "supplyName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Supply.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], Supply.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", String)
], Supply.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'low_stock_limit', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], Supply.prototype, "lowStockLimit", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'last_updated', type: 'timestamp' }),
    __metadata("design:type", Date)
], Supply.prototype, "lastUpdated", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => supplier_supply_entity_1.SupplierSupply, (supplierSupply) => supplierSupply.supply),
    __metadata("design:type", Array)
], Supply.prototype, "supplierSupplies", void 0);
exports.Supply = Supply = __decorate([
    (0, typeorm_1.Entity)('supplies')
], Supply);
