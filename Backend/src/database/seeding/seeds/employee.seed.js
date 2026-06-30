"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedEmployees = seedEmployees;
const employee_entity_1 = require("../../entities/employee.entity");
const user_entity_1 = require("../../entities/user.entity");
const department_entity_1 = require("../../entities/department.entity");
async function seedEmployees(dataSource) {
    const employeeRepo = dataSource.getRepository(employee_entity_1.Employee);
    const userRepo = dataSource.getRepository(user_entity_1.User);
    const departmentRepo = dataSource.getRepository(department_entity_1.Department);
    const vetUser = await userRepo.findOne({
        where: {
            email: 'vet@test.com',
        },
    });
    const supportUser = await userRepo.findOne({
        where: {
            email: 'support@test.com',
        },
    });
    const managerUser = await userRepo.findOne({
        where: {
            email: 'manager@test.com',
        },
    });
    const veterinaryDepartment = await departmentRepo.findOne({
        where: {
            departmentName: 'Veterinary',
        },
    });
    const customerServiceDepartment = await departmentRepo.findOne({
        where: {
            departmentName: 'Customer Service',
        },
    });
    const managementDepartment = await departmentRepo.findOne({
        where: {
            departmentName: 'Management',
        },
    });
    if (!vetUser ||
        !supportUser ||
        !managerUser ||
        !veterinaryDepartment ||
        !customerServiceDepartment ||
        !managementDepartment) {
        throw new Error('Users and Departments must exist');
    }
    const employees = [
        {
            user: vetUser,
            department: veterinaryDepartment,
            salary: '1200',
            hireDate: '2025-01-01',
            address: 'Amman',
        },
        {
            user: supportUser,
            department: customerServiceDepartment,
            salary: '900',
            hireDate: '2025-01-01',
            address: 'Amman',
        },
        {
            user: managerUser,
            department: managementDepartment,
            salary: '1500',
            hireDate: '2025-01-01',
            address: 'Amman',
        },
    ];
    for (const employee of employees) {
        const exists = await employeeRepo.findOne({
            where: {
                userId: employee.user.userId,
            },
        });
        if (exists) {
            await employeeRepo.save(employeeRepo.merge(exists, employee));
        }
        else {
            await employeeRepo.save(employeeRepo.create(employee));
        }
    }
    console.log('Employees seeded');
}
