import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AdoptionReportQueryDto,
  InventoryReportQueryDto,
  PetReportQueryDto,
} from '@shared/dto';
import {
  AdoptionStatusEnum,
  PetStatusEnum,
  SupplyStatusEnum,
} from '@shared/enums';

import { AdoptionRequest, Pet, Supplier, Supply } from '../../database/entities';
import { generateCsv } from './generators/csv.generator';
import { generatePdf } from './generators/pdf.generator';

interface AdoptionReportRow {
  adoptionId: string;
  pet: string;
  species: string;
  breed: string;
  adopter: string;
  requestDate: string;
  approvalDate: string;
  status: string;
  approvedBy: string;
}

interface InventoryReportRow {
  supply: string;
  category: string;
  quantity: number;
  minimum: number;
  status: string;
  supplier: string;
  inventoryValue: string;
}

interface PetReportRow {
  pet: string;
  species: string;
  breed: string;
  age: string | number;
  status: string;
  health: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(AdoptionRequest)
    private readonly adoptionRequestRepo: Repository<AdoptionRequest>,

    @InjectRepository(Supply)
    private readonly supplyRepo: Repository<Supply>,

    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,

    @InjectRepository(Pet)
    private readonly petRepo: Repository<Pet>,
  ) {}

  async getAdoptionReport(query: AdoptionReportQueryDto) {
    const rows = await this.getAdoptionRows(query);
    const summary = this.countByStatus(rows.map((row) => row.status));
    const approved = summary[AdoptionStatusEnum.APPROVED] ?? 0;
    const approvalRate =
      rows.length === 0 ? '0%' : `${Math.round((approved / rows.length) * 100)}%`;

    return {
      filters: query,
      summary: {
        totalRequests: rows.length,
        approved,
        pending: summary[AdoptionStatusEnum.PENDING] ?? 0,
        rejected: summary[AdoptionStatusEnum.REJECTED] ?? 0,
        cancelled:
          (summary.CANCELLED ?? 0) +
          (summary[AdoptionStatusEnum.CANCELED] ?? 0),
        approvalRate,
      },
      data: rows,
    };
  }

  async exportAdoptionsCsv(query: AdoptionReportQueryDto): Promise<Buffer> {
    const report = await this.getAdoptionReport(query);
    const headers = [
      'adoption_id',
      'pet',
      'species',
      'breed',
      'adopter',
      'request_date',
      'approval_date',
      'status',
      'approved_by',
    ];

    return generateCsv(
      report.data.map((row) => ({
        adoption_id: row.adoptionId,
        pet: row.pet,
        species: row.species,
        breed: row.breed,
        adopter: row.adopter,
        request_date: row.requestDate,
        approval_date: row.approvalDate,
        status: row.status,
        approved_by: row.approvedBy,
      })),
      headers,
    );
  }

  async exportAdoptionsPdf(query: AdoptionReportQueryDto): Promise<Buffer> {
    const report = await this.getAdoptionReport(query);

    return generatePdf({
      title: 'Adoption Report',
      period: this.formatPeriod(query.from, query.to),
      summary: {
        'Total Requests': report.summary.totalRequests,
        Approved: report.summary.approved,
        Pending: report.summary.pending,
        Rejected: report.summary.rejected,
        Cancelled: report.summary.cancelled,
        'Approval Rate': report.summary.approvalRate,
      },
      table: {
        headers: ['Adoption ID', 'Pet', 'Species', 'Breed', 'Adopter', 'Requested', 'Approved', 'Status', 'Approved By'],
        rows: report.data.map((row) => [
          row.adoptionId,
          row.pet,
          row.species,
          row.breed,
          row.adopter,
          row.requestDate,
          row.approvalDate,
          row.status,
          row.approvedBy,
        ]),
      },
    });
  }

  async getInventoryReport(query: InventoryReportQueryDto) {
    const rows = await this.getInventoryRows(query);
    const lowStock = rows.filter((row) => row.status === 'LOW_STOCK').length;
    const outOfStock = rows.filter(
      (row) => row.status === SupplyStatusEnum.OUT_OF_STOCK,
    ).length;
    const totalSuppliers = await this.supplierRepo.count({
      where: { isActive: true },
    });
    const inventoryValue = rows.reduce(
      (total, row) => total + Number(row.inventoryValue),
      0,
    );

    return {
      filters: query,
      summary: {
        totalItems: rows.length,
        lowStock,
        outOfStock,
        totalSuppliers,
        inventoryValue: `${inventoryValue.toFixed(2)} JD`,
      },
      data: rows,
    };
  }

  async exportInventoryCsv(query: InventoryReportQueryDto): Promise<Buffer> {
    const report = await this.getInventoryReport(query);
    const headers = [
      'supply',
      'category',
      'quantity',
      'minimum',
      'status',
      'supplier',
      'inventory_value',
    ];

    return generateCsv(
      report.data.map((row) => ({
        supply: row.supply,
        category: row.category,
        quantity: row.quantity,
        minimum: row.minimum,
        status: row.status,
        supplier: row.supplier,
        inventory_value: row.inventoryValue,
      })),
      headers,
    );
  }

  async exportInventoryPdf(query: InventoryReportQueryDto): Promise<Buffer> {
    const report = await this.getInventoryReport(query);

    return generatePdf({
      title: 'Inventory Report',
      summary: {
        'Total Items': report.summary.totalItems,
        'Low Stock': report.summary.lowStock,
        'Out Of Stock': report.summary.outOfStock,
        'Total Suppliers': report.summary.totalSuppliers,
        'Inventory Value': report.summary.inventoryValue,
      },
      table: {
        headers: ['Supply', 'Category', 'Quantity', 'Minimum', 'Status', 'Supplier', 'Value'],
        rows: report.data.map((row) => [
          row.supply,
          row.category,
          row.quantity,
          row.minimum,
          row.status,
          row.supplier,
          row.inventoryValue,
        ]),
      },
    });
  }

  async getPetReport(query: PetReportQueryDto) {
    const rows = await this.getPetRows(query);
    const summary = this.countByStatus(rows.map((row) => row.status));

    return {
      filters: query,
      summary: {
        totalPets: rows.length,
        available: summary[PetStatusEnum.AVAILABLE] ?? 0,
        pendingAdoption: summary[PetStatusEnum.PENDING] ?? 0,
        adopted: summary[PetStatusEnum.ADOPTED] ?? 0,
        medicalCare: summary[PetStatusEnum.MEDICAL_HOLD] ?? 0,
      },
      data: rows,
    };
  }

  async exportPetsCsv(query: PetReportQueryDto): Promise<Buffer> {
    const report = await this.getPetReport(query);
    const headers = ['pet', 'species', 'breed', 'age', 'status', 'health'];

    return generateCsv(
      report.data.map((row) => ({
        pet: row.pet,
        species: row.species,
        breed: row.breed,
        age: row.age,
        status: row.status,
        health: row.health,
      })),
      headers,
    );
  }

  async exportPetsPdf(query: PetReportQueryDto): Promise<Buffer> {
    const report = await this.getPetReport(query);

    return generatePdf({
      title: 'Pet Report',
      summary: {
        'Total Pets': report.summary.totalPets,
        Available: report.summary.available,
        'Pending Adoption': report.summary.pendingAdoption,
        Adopted: report.summary.adopted,
        'Medical Care': report.summary.medicalCare,
      },
      table: {
        headers: ['Pet', 'Species', 'Breed', 'Age', 'Status', 'Health'],
        rows: report.data.map((row) => [
          row.pet,
          row.species,
          row.breed,
          row.age,
          row.status,
          row.health,
        ]),
      },
    });
  }

  private async getAdoptionRows(query: AdoptionReportQueryDto): Promise<AdoptionReportRow[]> {
    const qb = this.adoptionRequestRepo
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.pet', 'pet')
      .leftJoinAndSelect('request.adopter', 'adopter')
      .leftJoinAndSelect('adopter.user', 'adopterUser')
      .leftJoinAndSelect('request.reviewer', 'reviewer')
      .leftJoinAndSelect('request.adoption', 'adoption')
      .orderBy('request.requestDate', 'DESC');

    if (query.status) {
      const normalizedStatus =
        query.status === AdoptionStatusEnum.CANCELED ? 'CANCELLED' : query.status;
      qb.andWhere('UPPER(request.status) = :status', { status: normalizedStatus });
    }

    if (query.from) {
      qb.andWhere('request.requestDate >= :from', { from: query.from });
    }

    if (query.to) {
      qb.andWhere('request.requestDate <= :to', { to: query.to });
    }

    if (query.species && query.species.toUpperCase() !== 'ALL') {
      qb.andWhere('LOWER(pet.species) = LOWER(:species)', { species: query.species });
    }

    const requests = await qb.getMany();

    return requests.map((request) => ({
      adoptionId: request.adoption?.adoptionId ?? request.requestId,
      pet: request.pet?.petName ?? '',
      species: request.pet?.species ?? '',
      breed: request.pet?.breed ?? '',
      adopter: this.fullName(request.adopter?.user?.firstName, request.adopter?.user?.lastName),
      requestDate: request.requestDate,
      approvalDate: request.adoption?.adoptionDate ?? '',
      status: request.status,
      approvedBy: this.fullName(request.reviewer?.firstName, request.reviewer?.lastName),
    }));
  }

  private async getInventoryRows(query: InventoryReportQueryDto): Promise<InventoryReportRow[]> {
    const qb = this.supplyRepo
      .createQueryBuilder('supply')
      .leftJoinAndSelect('supply.supplier', 'supplier')
      .where('supply.isActive = :active', { active: true })
      .orderBy('supply.supplyName', 'ASC');

    if (query.category) {
      qb.andWhere('LOWER(supply.category) = LOWER(:category)', { category: query.category });
    }

    if (query.supplier) {
      qb.andWhere('supplier.supplierName ILIKE :supplier', {
        supplier: `%${query.supplier}%`,
      });
    }

    const supplies = await qb.getMany();
    const rows = supplies.map((supply) => {
      const status = this.inventoryStatus(supply);

      return {
        supply: supply.supplyName,
        category: supply.category,
        quantity: supply.quantity,
        minimum: supply.lowStockLimit,
        status,
        supplier: supply.supplier?.supplierName ?? '',
        inventoryValue: (supply.quantity * Number(supply.purchasePrice)).toFixed(2),
      };
    });

    return query.status ? rows.filter((row) => row.status === query.status) : rows;
  }

  private async getPetRows(query: PetReportQueryDto): Promise<PetReportRow[]> {
    const qb = this.petRepo
      .createQueryBuilder('pet')
      .where('pet.deletedAt IS NULL')
      .orderBy('pet.petName', 'ASC');

    if (query.species && query.species.toUpperCase() !== 'ALL') {
      qb.andWhere('LOWER(pet.species) = LOWER(:species)', { species: query.species });
    }

    if (query.status) {
      qb.andWhere('UPPER(pet.adoptionStatus) = :status', { status: query.status });
    }

    if (query.health) {
      qb.andWhere('LOWER(pet.healthStatus) = LOWER(:health)', { health: query.health });
    }

    if (query.minAge !== undefined) {
      qb.andWhere('pet.age >= :minAge', { minAge: query.minAge });
    }

    if (query.maxAge !== undefined) {
      qb.andWhere('pet.age <= :maxAge', { maxAge: query.maxAge });
    }

    const pets = await qb.getMany();

    return pets.map((pet) => ({
      pet: pet.petName,
      species: pet.species,
      breed: pet.breed ?? '',
      age: pet.age ?? '',
      status: pet.adoptionStatus,
      health: pet.healthStatus ?? '',
    }));
  }

  private inventoryStatus(supply: Supply): string {
    if (supply.quantity <= 0 || supply.status === SupplyStatusEnum.OUT_OF_STOCK) {
      return SupplyStatusEnum.OUT_OF_STOCK;
    }

    if (supply.quantity <= supply.lowStockLimit) {
      return 'LOW_STOCK';
    }

    return 'OK';
  }

  private countByStatus(statuses: string[]): Record<string, number> {
    return statuses.reduce<Record<string, number>>((counts, status) => {
      const key = status.toUpperCase();
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {});
  }

  private fullName(firstName?: string, lastName?: string): string {
    return [firstName, lastName].filter(Boolean).join(' ');
  }

  private formatPeriod(from?: string, to?: string): string {
    if (from && to) {
      return `${from} - ${to}`;
    }

    if (from) {
      return `From ${from}`;
    }

    if (to) {
      return `Until ${to}`;
    }

    return 'All dates';
  }
}
