"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedRoles = seedRoles;
const role_entity_1 = require("../../entities/role.entity");
async function seedRoles(dataSource) {
    const repo = dataSource.getRepository(role_entity_1.Role);
    const roles = [
        'ADMIN',
        'MANAGER',
        'VET',
        'EMPLOYEE',
        'ADOPTER',
    ];
    for (const roleName of roles) {
        const exists = await repo.findOne({
            where: { roleName },
        });
        const roleData = { roleName };
        if (exists) {
            await repo.save(repo.merge(exists, roleData));
        }
        else {
            await repo.save(repo.create(roleData));
        }
    }
    console.log('Roles seeded');
}
