"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSuppliers = seedSuppliers;
const supplier_entity_1 = require("../../entities/supplier.entity");
async function seedSuppliers(dataSource) {
    const repo = dataSource.getRepository(supplier_entity_1.Supplier);
    const suppliers = [
        {
            supplierName: 'Pet Food Company',
            phone: '0791111111',
            email: 'food@supplier.com',
            city: 'Amman',
            country: 'Jordan',
        },
        {
            supplierName: 'Vet Medical Supply',
            phone: '0792222222',
            email: 'medical@supplier.com',
            city: 'Amman',
            country: 'Jordan',
        },
        {
            supplierName: 'Pet Accessories Ltd',
            phone: '0793333333',
            email: 'accessories@supplier.com',
            city: 'Zarqa',
            country: 'Jordan',
        },
    ];
    for (const supplier of suppliers) {
        const exists = await repo.findOne({
            where: {
                supplierName: supplier.supplierName,
            },
        });
        if (exists) {
            await repo.save(repo.merge(exists, supplier));
        }
        else {
            await repo.save(repo.create(supplier));
        }
    }
    console.log('Suppliers seeded');
}
