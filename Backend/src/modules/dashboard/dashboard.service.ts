import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import {
  ActivityLog,
  Adoption,
  AdoptionRequest,
  MedicalRecord,
  Pet,
  Supplier,
  Supply,
  User,
  Vaccination,
} from '../../database/entities';
import {
  AdminDashboardDto,
  DashboardActivityLogDto,
  ManagerDashboardDto,
} from '@shared/dto/dashboard.dto';

const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  VET: 'VET',
  ADOPTER: 'ADOPTER',
} as const;

const PET_STATUS = {
  AVAILABLE: 'available',
  ADOPTED: 'adopted',
  PENDING: 'pending',
} as const;

const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELED: 'canceled',
} as const;

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Pet)
    private readonly petRepo: Repository<Pet>,

    @InjectRepository(AdoptionRequest)
    private readonly adoptionRequestRepo: Repository<AdoptionRequest>,

    @InjectRepository(Adoption)
    private readonly adoptionRepo: Repository<Adoption>,

    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepo: Repository<MedicalRecord>,

    @InjectRepository(Vaccination)
    private readonly vaccinationRepo: Repository<Vaccination>,

    @InjectRepository(Supply)
    private readonly supplyRepo: Repository<Supply>,

    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,

    @InjectRepository(ActivityLog)
    private readonly activityLogRepo: Repository<ActivityLog>,
  ) {}

  async getAdminDashboard(): Promise<AdminDashboardDto> {
    const [users, pets, adoptions, medical, supplies, recentActivityLogs] =
      await Promise.all([
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

  async getManagerDashboard(): Promise<ManagerDashboardDto> {
    const [users, pets, adoptions, medical, supplies, recentActivityLogs] =
      await Promise.all([
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

  private async getAdminUserStats() {
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
        .getRawMany<{ roleName: string; count: string }>(),
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

  private async getManagerUserStats() {
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
      .getRawMany<{ roleName: string; count: string }>();

    const counts = this.toCountMap(rows, 'roleName');

    return {
      total: this.sumCounts(counts),
      employee: counts[ROLES.EMPLOYEE] ?? 0,
      vet: counts[ROLES.VET] ?? 0,
      adopter: counts[ROLES.ADOPTER] ?? 0,
    };
  }

  private async getPetStats(includeRecentlyAdded: boolean) 
  //if admin includeRecentlyAdded = true, if manager includeRecentlyAdded = false
  {
    const last30Days = this.daysAgo(30);
    const [total, available, adopted, pendingAdoption, addedRecently] =
      await Promise.all([
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

  private async getAdoptionRequestStats() {
    const [totalRequests, pending, approved, rejectedOrCanceled] =
      await Promise.all([
        this.adoptionRequestRepo.count(),
        this.adoptionRequestRepo.count({
          where: { status: REQUEST_STATUS.PENDING },
        }),
        this.adoptionRequestRepo.count({
          where: { status: REQUEST_STATUS.APPROVED },
        }),
        this.adoptionRequestRepo.count({
          where: {
            status: In([
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

  private async getAdminMedicalStats() {
    const [totalMedicalRecords, totalVaccinations, petsNeedingMedicalAttention] =
      await Promise.all([
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

  private async getManagerMedicalStats() {
    const totalVaccinations = await this.vaccinationRepo.count();

    return {
      totalVaccinations,
    };
  }

  private async getAdminSupplyStats() {
    const [totalSupplies, lowStockSupplies, totalSuppliers] =
      await Promise.all([
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

  private async getManagerSupplyStats() {
    const [availableSupplies, lowStockSupplies, totalSuppliers] =
      await Promise.all([
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

  private getLowStockSupplyCount() {
    return this.supplyRepo
      .createQueryBuilder('supply')
      .where('supply.quantity <= supply.lowStockLimit')
      .getCount();
  }

  private async getRecentActivityLogs(): Promise<DashboardActivityLogDto[]> {
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
  private toCountMap(
    rows: Array<Record<string, string>>,
    keyField: string,
  ): Record<string, number> {
    return rows.reduce<Record<string, number>>((counts, row) => {
      counts[row[keyField]] = Number(row.count);
      return counts;
    }, {});
  }

  //sum all counts in the map
  private sumCounts(counts: Record<string, number>) {
    return Object.values(counts).reduce((total, count) => total + count, 0);
  }

  //get date of n days ago
  private daysAgo(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }
}
