"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSupplies = seedSupplies;
const supply_entity_1 = require("../../entities/supply.entity");
async function seedSupplies(dataSource) {
    const repo = dataSource.getRepository(supply_entity_1.Supply);
    const supplies = [
        {
            supplyName: 'Dog Food',
            category: 'Food',
            quantity: 100,
            unitPrice: '10.00',
            lowStockLimit: 20,
        },
        {
            supplyName: 'Cat Food',
            category: 'Food',
            quantity: 80,
            unitPrice: '8.00',
            lowStockLimit: 15,
        },
        {
            supplyName: 'Rabies Vaccine',
            category: 'Medical',
            quantity: 50,
            unitPrice: '25.00',
            lowStockLimit: 10,
        },
        {
            supplyName: 'Pet Shampoo',
            category: 'Care',
            quantity: 30,
            unitPrice: '12.00',
            lowStockLimit: 5,
        },
        {
            supplyName: 'Rabbit Food',
            category: 'Food',
            quantity: 40,
            unitPrice: '6.00',
            lowStockLimit: 10,
        },
    ];
    for (const supply of supplies) {
        const exists = await repo.findOne({
            where: {
                supplyName: supply.supplyName,
                category: supply.category,
            },
        });
        if (exists) {
            await repo.save(repo.merge(exists, supply));
        }
        else {
            await repo.save(repo.create(supply));
        }
    }
    console.log('Supplies seeded');
}
