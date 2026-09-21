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
  UserActivityAnalyticsDto,
  UserActivityAnalyticsQueryDto,
} from '@shared/dto';

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

  async getUserActivityAnalytics(
    query: UserActivityAnalyticsQueryDto,
  ): Promise<UserActivityAnalyticsDto> {
    const now = new Date();
    //if frontend gives date use it otherwise default to the last 30 days.
    const from = query.from ? new Date(query.from) : this.daysAgo(30);
    //if the frontend gives a date use it otherwise use now.
    const to = query.to ? this.endOfQueryDate(query.to) : now;
    //if limit exists use it otherwise default to 10.
    const limit = query.limit ?? 10;
    const range = { from, to };

    //run 5 DB queries in parallel
    const [summary, trendRows, actionRows, entityRows, topUserRows] =
      await Promise.all([
        this.activityLogRepo
          .createQueryBuilder('log')
          .select('COUNT(log.logId)', 'totalActivities')
          //counts activities that have a user attached
          .addSelect(
            'COUNT(log.logId) FILTER (WHERE log.userId IS NOT NULL)',
            'attributedActivities',
          )
          .addSelect('COUNT(DISTINCT log.userId)', 'uniqueActiveUsers')
          .where('log.createdAt >= :from AND log.createdAt < :to', range)
          .getRawOne<{
            totalActivities: string;
            attributedActivities: string;
            uniqueActiveUsers: string;
          }>(),
        this.activityLogRepo
          .createQueryBuilder('log')
          //UTC = Coordinated Universal Time.
          //convert createdAt to UTC date string in format YYYY-MM-DD and group by it
          .select(
            "TO_CHAR(log.createdAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')",
            'date',
          )
          //calculate count of logs and count of unique users for each date
          .addSelect('COUNT(log.logId)', 'count')
          .addSelect('COUNT(DISTINCT log.userId)', 'uniqueUsers')
          //bring the logs in the given date range// >= from(included) < to(excluded)
          .where('log.createdAt >= :from AND log.createdAt < :to', range)
          //collect the activities that happened on the same date together and group them by date
          .groupBy("TO_CHAR(log.createdAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')")
          .orderBy('date', 'ASC')
          .getRawMany<{ date: string; count: string; uniqueUsers: string }>(),
        this.activityLogRepo
          .createQueryBuilder('log')
          .select('log.action', 'name')
          .addSelect('COUNT(log.logId)', 'count')
          .where('log.createdAt >= :from AND log.createdAt < :to', range)
          .groupBy('log.action')
          .orderBy('count', 'DESC')
          .addOrderBy('name', 'ASC')
          .getRawMany<{ name: string; count: string }>(),
        this.activityLogRepo
          .createQueryBuilder('log')
          .select('log.entityType', 'name')
          .addSelect('COUNT(log.logId)', 'count')
          .where('log.createdAt >= :from AND log.createdAt < :to', range)
          .groupBy('log.entityType')
          .orderBy('count', 'DESC')
          .addOrderBy('name', 'ASC')
          .getRawMany<{ name: string; count: string }>(),
        this.activityLogRepo
          .createQueryBuilder('log')
          //get info about that user,counts how many activites each user performed, group by user, put most active users first,take only the top N.
          .innerJoin('log.user', 'user')
          .select('user.userId', 'userId')
          .addSelect('user.firstName', 'firstName')
          .addSelect('user.lastName', 'lastName')
          .addSelect('user.email', 'email')
          .addSelect('COUNT(log.logId)', 'activityCount')
          .where('log.createdAt >= :from AND log.createdAt < :to', range)
          .groupBy('user.userId')
          .addGroupBy('user.firstName')
          .addGroupBy('user.lastName')
          .addGroupBy('user.email')
          .orderBy('COUNT(log.logId)', 'DESC')
          .addOrderBy('user.userId', 'ASC')
          .limit(limit)
          .getRawMany<{
            userId: string;
            firstName: string;
            lastName: string;
            email: string;
            activityCount: string;
          }>(),
      ]);

    const totalActivities = Number(summary?.totalActivities ?? 0);
    const attributedActivities = Number(summary?.attributedActivities ?? 0);
    const uniqueActiveUsers = Number(summary?.uniqueActiveUsers ?? 0);

    return {
      filters: {
        from: from.toISOString(),
        to: to.toISOString(),
        limit,
      },
      summary: {
        totalActivities,
        uniqueActiveUsers,
        averageActivitiesPerActiveUser:
          uniqueActiveUsers === 0
            ? 0
            : Number((attributedActivities / uniqueActiveUsers).toFixed(2)),
      },
      trend: trendRows.map((row) => ({
        date: row.date,
        count: Number(row.count),
        uniqueUsers: Number(row.uniqueUsers),
      })),
      actions: actionRows.map((row) => ({
        name: row.name,
        count: Number(row.count),
      })),
      entities: entityRows.map((row) => ({
        name: row.name,
        count: Number(row.count),
      })),
      topUsers: topUserRows.map((row) => ({
        userId: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        activityCount: Number(row.activityCount),
      })),
    };
  }

  private async getAdminUserStats() {
    //run all quieries in parallel to improve performance
    const [roleRows, active, inactive] = await Promise.all([
      this.userRepo
      //to write sql as typeORM
        .createQueryBuilder('user')
        //only active users should contribute to role counts
        .where('user.status = :status', {
          status: USER_STATUS.ACTIVE,
        })
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
      //only active users should appear in current dashboard counts
      .where('user.status = :status', {
        status: USER_STATUS.ACTIVE,
      })
      //only active roles should be counted for manager stats
      .andWhere('role.isActive = true')
      //filter only employee, vet and adopter roles
      //typeORM istead of WHERE role IN (...) in sql
      .andWhere('role.roleName IN (:...roles)', {
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
    const [pending, approved, rejectedOrCanceled] =
      await Promise.all([
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

    const totalRequests = pending + approved + rejectedOrCanceled;

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
    const [totalMedicalRecords, totalVaccinations] = await Promise.all([
      this.medicalRecordRepo.count(),
      this.vaccinationRepo.count(),
    ]);

    return {
      totalMedicalRecords,
      totalVaccinations,
    };
  }

  private async getAdminSupplyStats() {
    const [totalSupplies, availableSupplies, lowStockSupplies, totalSuppliers] =
      await Promise.all([
        this.supplyRepo.count({ where: { isActive: true } }),
        this.supplyRepo
          .createQueryBuilder('supply')
          .where('supply.quantity > 0')
          .andWhere('supply.isActive = true')
          .getCount(),
        this.getLowStockSupplyCount(),
        this.supplierRepo.count({ where: { isActive: true } }),
      ]);

    return {
      totalSupplies,
      availableSupplies,
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
          .andWhere('supply.isActive = true')
          .getCount(),
        this.getLowStockSupplyCount(),
        this.supplierRepo.count({ where: { isActive: true } }),
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
      .andWhere('supply.isActive = true')
      .getCount();
  }

  private async getRecentActivityLogs(): Promise<DashboardActivityLogDto[]> {
    const since = this.daysAgo(30);
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
      .where('log.createdAt >= :since', { since })
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

  private endOfQueryDate(value: string) {
    const date = new Date(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      date.setUTCDate(date.getUTCDate() + 1);
    }
    return date;
  }
}
