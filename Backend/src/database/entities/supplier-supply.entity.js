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
exports.SupplierSupply = void 0;
const typeorm_1 = require("typeorm");
const supplier_entity_1 = require("./supplier.entity");
const supply_entity_1 = require("./supply.entity");
let SupplierSupply = class SupplierSupply {
};
exports.SupplierSupply = SupplierSupply;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid', { name: 'supplier_supply_id' }),
    __metadata("design:type", String)
], SupplierSupply.prototype, "supplierSupplyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'supplier_id', type: 'uuid' }),
    __metadata("design:type", String)
], SupplierSupply.prototype, "supplierId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'supply_id', type: 'uuid' }),
    __metadata("design:type", String)
], SupplierSupply.prototype, "supplyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'supply_price', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", String)
], SupplierSupply.prototype, "supplyPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivery_time', type: 'varchar', length: 80, nullable: true }),
    __metadata("design:type", String)
], SupplierSupply.prototype, "deliveryTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'minimum_order_quantity', type: 'integer', default: 1 }),
    __metadata("design:type", Number)
], SupplierSupply.prototype, "minimumOrderQuantity", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => supplier_entity_1.Supplier, (supplier) => supplier.supplierSupplies, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'supplier_id' }),
    __metadata("design:type", supplier_entity_1.Supplier)
], SupplierSupply.prototype, "supplier", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => supply_entity_1.Supply, (supply) => supply.supplierSupplies, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'supply_id' }),
    __metadata("design:type", supply_entity_1.Supply)
], SupplierSupply.prototype, "supply", void 0);
exports.SupplierSupply = SupplierSupply = __decorate([
    (0, typeorm_1.Entity)('supplier_supplies'),
    (0, typeorm_1.Unique)(['supplierId', 'supplyId'])
], SupplierSupply);
