"use strict";
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
exports.seedUsers = seedUsers;
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../../entities/user.entity");
const role_entity_1 = require("../../entities/role.entity");
async function seedUsers(dataSource) {
    const userRepo = dataSource.getRepository(user_entity_1.User);
    const roleRepo = dataSource.getRepository(role_entity_1.Role);
    const adminRole = await roleRepo.findOne({
        where: {
            roleName: 'ADMIN',
        },
    });
    const managerRole = await roleRepo.findOne({
        where: {
            roleName: 'MANAGER',
        },
    });
    const vetRole = await roleRepo.findOne({
        where: {
            roleName: 'VET',
        },
    });
    const employeeRole = await roleRepo.findOne({
        where: {
            roleName: 'EMPLOYEE',
        },
    });
    const adopterRole = await roleRepo.findOne({
        where: {
            roleName: 'ADOPTER',
        },
    });
    if (!adminRole ||
        !managerRole ||
        !vetRole ||
        !employeeRole ||
        !adopterRole) {
        throw new Error('Roles must exist before users');
    }
    const users = [
        {
            firstName: 'Shahd',
            lastName: 'Admin',
            email: 'shahd.shawish@gmail.com',
            password: 'Admin@123',
            role: adminRole,
            status: 'active',
        },
        {
            firstName: 'Farah',
            lastName: 'Vet',
            email: 'vet@test.com',
            password: 'Vet@1234',
            role: vetRole,
            status: 'active',
        },
        {
            firstName: 'Lubna',
            lastName: 'Support',
            email: 'support@test.com',
            password: 'Support@123',
            role: employeeRole,
            status: 'active',
        },
        {
            firstName: 'Roaa',
            lastName: 'Manager',
            email: 'manager@test.com',
            password: 'Manager@123',
            role: managerRole,
            status: 'active',
        },
        {
            firstName: 'Joud',
            lastName: 'Adopter',
            email: 'adopter1@test.com',
            password: 'Adopter@123',
            role: adopterRole,
            status: 'active',
        },
        {
            firstName: 'Maya',
            lastName: 'Adopter',
            email: 'adopter2@test.com',
            password: 'Adopter@123',
            role: adopterRole,
            status: 'active',
        },
        {
            firstName: 'Noor',
            lastName: 'Adopter',
            email: 'adopter3@test.com',
            password: 'Adopter@123',
            role: adopterRole,
            status: 'active',
        },
        {
            firstName: 'Yousef',
            lastName: 'Adopter',
            email: 'adopter4@test.com',
            password: 'Adopter@123',
            role: adopterRole,
            status: 'active',
        },
        {
            firstName: 'Leen',
            lastName: 'Adopter',
            email: 'adopter5@test.com',
            password: 'Adopter@123',
            role: adopterRole,
            status: 'active',
        },
    ];
    for (const user of users) {
        const exists = await userRepo.findOne({
            where: {
                email: user.email,
            },
        });
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const userData = {
            ...user,
            password: hashedPassword,
        };
        if (exists) {
            // Update existing user with new data from seed
            await userRepo.update(exists.userId, userData);
        }
        else {
            // Create user if they don't exist
            await userRepo.save(userRepo.create(userData));
        }
    }
    console.log('Users seeded');
}
