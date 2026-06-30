"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDepartments = seedDepartments;
const department_entity_1 = require("../../entities/department.entity");
async function seedDepartments(dataSource) {
    const repo = dataSource.getRepository(department_entity_1.Department);
    const departments = [
        {
            departmentName: 'Veterinary',
        },
        {
            departmentName: 'Customer Service',
        },
        {
            departmentName: 'Management',
        },
    ];
    for (const department of departments) {
        const exists = await repo.findOne({
            where: {
                departmentName: department.departmentName,
            },
        });
        if (exists) {
            await repo.save(repo.merge(exists, department));
        }
        else {
            await repo.save(repo.create(department));
        }
    }
    console.log('Departments seeded');
}
