"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSupplierSupplies = seedSupplierSupplies;
const supplier_entity_1 = require("../../entities/supplier.entity");
const supply_entity_1 = require("../../entities/supply.entity");
const supplier_supply_entity_1 = require("../../entities/supplier-supply.entity");
async function seedSupplierSupplies(dataSource) {
    const supplierRepo = dataSource.getRepository(supplier_entity_1.Supplier);
    const supplyRepo = dataSource.getRepository(supply_entity_1.Supply);
    const repo = dataSource.getRepository(supplier_supply_entity_1.SupplierSupply);
    const suppliers = await supplierRepo.find();
    const supplies = await supplyRepo.find();
    if (suppliers.length === 0 || supplies.length === 0) {
        console.log('Skipping SupplierSupplies seed: missing data');
        return;
    }
    const supplierFood = suppliers.find((s) => s.supplierName === 'Pet Food Company');
    const supplierMedical = suppliers.find((s) => s.supplierName === 'Vet Medical Supply');
    const supplierAccessories = suppliers.find((s) => s.supplierName === 'Pet Accessories Ltd');
    const dogFood = supplies.find((s) => s.supplyName === 'Dog Food');
    const catFood = supplies.find((s) => s.supplyName === 'Cat Food');
    const rabies = supplies.find((s) => s.supplyName === 'Rabies Vaccine');
    const shampoo = supplies.find((s) => s.supplyName === 'Pet Shampoo');
    const rabbitFood = supplies.find((s) => s.supplyName === 'Rabbit Food');
    const relations = [
        {
            supplier: supplierFood,
            supply: dogFood,
            supplyPrice: '9.50',
        },
        {
            supplier: supplierFood,
            supply: catFood,
            supplyPrice: '7.50',
        },
        {
            supplier: supplierMedical,
            supply: rabies,
            supplyPrice: '22.00',
        },
        {
            supplier: supplierAccessories,
            supply: shampoo,
            supplyPrice: '10.00',
        },
        {
            supplier: supplierAccessories,
            supply: rabbitFood,
            supplyPrice: '5.50',
        },
    ];
    for (const relation of relations) {
        if (!relation.supplier || !relation.supply)
            continue;
        const exists = await repo.findOne({
            where: {
                supplierId: relation.supplier.supplierId,
                supplyId: relation.supply.supplyId,
            },
        });
        const supplierSupplyData = {
            supplier: relation.supplier,
            supply: relation.supply,
            supplyPrice: relation.supplyPrice,
            deliveryTime: '3 days',
            minimumOrderQuantity: 5,
        };
        if (exists) {
            await repo.save(repo.merge(exists, supplierSupplyData));
        }
        else {
            await repo.save(repo.create(supplierSupplyData));
        }
    }
    console.log('Supplier Supplies seeded');
}
