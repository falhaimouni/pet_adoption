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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
};
const ROLES = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    EMPLOYEE: 'EMPLOYEE',
    VET: 'VET',
    ADOPTER: 'ADOPTER',
};
const PET_STATUS = {
    AVAILABLE: 'available',
    ADOPTED: 'adopted',
    PENDING: 'pending',
};
const REQUEST_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELED: 'canceled',
};
let DashboardService = class DashboardService {
    constructor(userRepo, petRepo, adoptionRequestRepo, adoptionRepo, medicalRecordRepo, vaccinationRepo, supplyRepo, supplierRepo, activityLogRepo) {
        this.userRepo = userRepo;
        this.petRepo = petRepo;
        this.adoptionRequestRepo = adoptionRequestRepo;
        this.adoptionRepo = adoptionRepo;
        this.medicalRecordRepo = medicalRecordRepo;
        this.vaccinationRepo = vaccinationRepo;
        this.supplyRepo = supplyRepo;
        this.supplierRepo = supplierRepo;
        this.activityLogRepo = activityLogRepo;
    }
    async getAdminDashboard() {
        const [users, pets, adoptions, medical, supplies, recentActivityLogs] = await Promise.all([
            this.getAdminUserStats(),
            this.getPetStats(true),
            this.getAdoptionRequestStats(),
            this.getAdminMedicalStats(),
            this.getAdminSupplyStats(),
            this.getRecentActivityLogs(),
        ]);
        return {
            users,
            pets,
            adoptions,
            medical,
            supplies,
            activity: {
                recentActivityLogs,
            },
        };
    }
    async getManagerDashboard() {
        const [users, pets, adoptions, medical, supplies, recentActivityLogs] = await Promise.all([
            this.getManagerUserStats(),
            this.getPetStats(false),
            this.getAdoptionRequestStats(),
            this.getManagerMedicalStats(),
            this.getManagerSupplyStats(),
            this.getRecentActivityLogs(),
        ]);
        return {
            users,
            pets,
            adoptions,
            medical,
            supplies,
            activity: {
                recentActivityLogs,
            },
        };
    }
    async getAdminUserStats() {
        //run all quieries in parallel to improve performance
        const [roleRows, active, inactive] = await Promise.all([
            this.userRepo
                //to write sql as typeORM
                .createQueryBuilder('user')
                //join user table with role table to get role name
                .innerJoin('user.role', 'role')
                //get role name
                .select('role.roleName', 'roleName')
                //count number of users for each role
                .addSelect('COUNT(user.userId)', 'count')
                //group by role name
                .groupBy('role.roleName')
                .getRawMany(),
            this.userRepo.count({ where: { status: USER_STATUS.ACTIVE } }),
            this.userRepo.count({ where: { status: USER_STATUS.INACTIVE } }),
        ]);
        //convert it to readable format
        const counts = this.toCountMap(roleRows, 'roleName');
        return {
            total: this.sumCounts(counts),
            //if there is no user for a role, return 0 insted of undefined
            admin: counts[ROLES.ADMIN] ?? 0,
            manager: counts[ROLES.MANAGER] ?? 0,
            employee: counts[ROLES.EMPLOYEE] ?? 0,
            vet: counts[ROLES.VET] ?? 0,
            adopter: counts[ROLES.ADOPTER] ?? 0,
            active,
            inactive,
        };
    }
    async getManagerUserStats() {
        const rows = await this.userRepo
            .createQueryBuilder('user')
            .innerJoin('user.role', 'role')
            .select('role.roleName', 'roleName')
            .addSelect('COUNT(user.userId)', 'count')
            //filter only employee, vet and adopter roles
            //typeORM istead of WHERE role IN (...) in sql
            .where('role.roleName IN (:...roles)', {
            roles: [ROLES.EMPLOYEE, ROLES.VET, ROLES.ADOPTER],
        })
            .groupBy('role.roleName')
            .getRawMany();
        const counts = this.toCountMap(rows, 'roleName');
        return {
            total: this.sumCounts(counts),
            employee: counts[ROLES.EMPLOYEE] ?? 0,
            vet: counts[ROLES.VET] ?? 0,
            adopter: counts[ROLES.ADOPTER] ?? 0,
        };
    }
    async getPetStats(includeRecentlyAdded) {
        const last30Days = this.daysAgo(30);
        const [total, available, adopted, pendingAdoption, addedRecently] = await Promise.all([
            this.petRepo.count(),
            this.petRepo.count({ where: { adoptionStatus: PET_STATUS.AVAILABLE } }),
            this.petRepo.count({ where: { adoptionStatus: PET_STATUS.ADOPTED } }),
            this.petRepo.count({ where: { adoptionStatus: PET_STATUS.PENDING } }),
            includeRecentlyAdded
                ? this.petRepo
                    .createQueryBuilder('pet')
                    .where('pet.createdAt >= :last30Days', { last30Days })
                    .getCount()
                : Promise.resolve(undefined),
        ]);
        return {
            total,
            available,
            adopted,
            pendingAdoption,
            //if admin include it if manager don't include it
            ...(includeRecentlyAdded ? { addedRecently } : {}),
        };
    }
    async getAdoptionRequestStats() {
        const [totalRequests, pending, approved, rejectedOrCanceled] = await Promise.all([
            this.adoptionRequestRepo.count(),
            this.adoptionRequestRepo.count({
                where: { status: REQUEST_STATUS.PENDING },
            }),
            this.adoptionRequestRepo.count({
                where: { status: REQUEST_STATUS.APPROVED },
            }),
            this.adoptionRequestRepo.count({
                where: {
                    status: (0, typeorm_2.In)([
                        REQUEST_STATUS.REJECTED,
                        REQUEST_STATUS.CANCELED,
                    ]),
                },
            }),
        ]);
        return {
            totalRequests,
            pending,
            approved,
            rejectedOrCanceled,
        };
    }
    async getAdminMedicalStats() {
        const [totalMedicalRecords, totalVaccinations, petsNeedingMedicalAttention] = await Promise.all([
            this.medicalRecordRepo.count(),
            this.vaccinationRepo.count(),
            this.petRepo
                .createQueryBuilder('pet')
                .where('pet.healthStatus IS NOT NULL')
                .andWhere('LOWER(pet.healthStatus) NOT IN (:...healthyStatuses)', {
                healthyStatuses: ['healthy', 'good', 'normal'],
            })
                .getCount(),
        ]);
        return {
            totalMedicalRecords,
            totalVaccinations,
            petsNeedingMedicalAttention,
        };
    }
    async getManagerMedicalStats() {
        const totalVaccinations = await this.vaccinationRepo.count();
        return {
            totalVaccinations,
        };
    }
    async getAdminSupplyStats() {
        const [totalSupplies, lowStockSupplies, totalSuppliers] = await Promise.all([
            this.supplyRepo.count(),
            this.getLowStockSupplyCount(),
            this.supplierRepo.count(),
        ]);
        return {
            totalSupplies,
            lowStockSupplies,
            totalSuppliers,
        };
    }
    async getManagerSupplyStats() {
        const [availableSupplies, lowStockSupplies, totalSuppliers] = await Promise.all([
            this.supplyRepo
                .createQueryBuilder('supply')
                .where('supply.quantity > 0')
                .getCount(),
            this.getLowStockSupplyCount(),
            this.supplierRepo.count(),
        ]);
        return {
            availableSupplies,
            lowStockSupplies,
            totalSuppliers,
        };
    }
    getLowStockSupplyCount() {
        return this.supplyRepo
            .createQueryBuilder('supply')
            .where('supply.quantity <= supply.lowStockLimit')
            .getCount();
    }
    async getRecentActivityLogs() {
        const logs = await this.activityLogRepo
            .createQueryBuilder('log')
            //get the user who performed the action
            .leftJoinAndSelect('log.user', 'user')
            .select([
            'log.logId',
            'log.action',
            'log.entityType',
            'log.entityId',
            'log.createdAt',
            'user.userId',
            'user.firstName',
            'user.lastName',
            'user.email',
        ])
            //newsest first
            .orderBy('log.createdAt', 'DESC')
            //limit to 10
            .take(10)
            .getMany();
        //entity to DTO
        return logs.map((log) => ({
            logId: log.logId,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            createdAt: log.createdAt,
            user: log.user
                ? {
                    userId: log.user.userId,
                    firstName: log.user.firstName,
                    lastName: log.user.lastName,
                    email: log.user.email,
                }
                : null,
        }));
    }
    //convert array of objects to map of counts
    toCountMap(rows, keyField) {
        return rows.reduce((counts, row) => {
            counts[row[keyField]] = Number(row.count);
            return counts;
        }, {});
    }
    //sum all counts in the map
    sumCounts(counts) {
        return Object.values(counts).reduce((total, count) => total + count, 0);
    }
    //get date of n days ago
    daysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Pet)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.AdoptionRequest)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.Adoption)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.MedicalRecord)),
    __param(5, (0, typeorm_1.InjectRepository)(entities_1.Vaccination)),
    __param(6, (0, typeorm_1.InjectRepository)(entities_1.Supply)),
    __param(7, (0, typeorm_1.InjectRepository)(entities_1.Supplier)),
    __param(8, (0, typeorm_1.InjectRepository)(entities_1.ActivityLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
