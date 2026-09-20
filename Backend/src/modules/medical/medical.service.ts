import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import {
  CreateMedicalEntryDto,
  UpdateMedicalEntryDto,
} from '@shared/dto/medical-record.dto';
import { MedicalEntry } from '../../database/entities/medical-entry.entity';
import { MedicalRecord } from '../../database/entities/medical-record.entity';
import { Pet } from '../../database/entities/pet.entity';
import { User } from '../../database/entities/user.entity';
import { ActivityLog } from '../../database/entities/activity-log.entity';
import { FileUpload } from '../../database/entities/file-upload.entity';
import { FileUploadCategory } from '@shared/enums';
import { UploadsService } from '../uploads/uploads.service';

interface MedicalVeterinarianResponse {
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
}

interface MedicalEntryResponse {
  entryId: string;
  recordId: string;
  diagnosis: string;
  treatment: string;
  vaccinationStatus: string;
  medicalDate: string;
  notes?: string | null;
  createdAt: Date;
  veterinarian: MedicalVeterinarianResponse;
}

interface MedicalRecordResponse {
  recordId: string;
  petId: string;
  createdAt: Date;
  pet: {
    petId: string;
    name: string;
    species: string;
    breed?: string | null;
    age?: number | null;
    gender?: string | null;
    healthStatus?: string | null;
    adoptionStatus: string;
  };
  entries: MedicalEntryResponse[];
}

@Injectable()
export class MedicalService {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepo: Repository<MedicalRecord>,

    @InjectRepository(MedicalEntry)
    private readonly medicalEntryRepo: Repository<MedicalEntry>,

    @InjectRepository(Pet)
    private readonly petRepo: Repository<Pet>,

    @InjectRepository(ActivityLog)
    private readonly activityLogRepo: Repository<ActivityLog>,

    private readonly uploadsService: UploadsService,
  ) {}

  async uploadMedicalDocument(
    petId: string,
    veterinarianId: string,
    file: Express.Multer.File,
  ): Promise<FileUpload> {
    let record: MedicalRecord;

    try {
      record = await this.getExistingRecordForPet(petId);
    } catch (error) {
      await this.uploadsService.rollbackFileUpload(file.path);
      throw error;
    }

    return this.uploadsService.createFileRecord(
      file,
      FileUploadCategory.DOCUMENT,
      veterinarianId,
      record.recordId,
    );
  }

  async findRecordByPet(petId: string): Promise<MedicalRecordResponse> {
    await this.ensurePetExists(petId);

    const record = await this.medicalRecordRepo.findOne({
      where: { petId },
      relations: ['pet', 'entries', 'entries.veterinarian'],
      order: {
        entries: {
          medicalDate: 'DESC',
          createdAt: 'DESC',
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    return this.mapRecordResponse(record);
  }

  async findEntry(entryId: string): Promise<MedicalEntryResponse> {
    const entry = await this.getEntryEntity(entryId);
    return this.mapEntryResponse(entry);
  }

  async addEntry(
    petId: string,
    veterinarianId: string,
    dto: CreateMedicalEntryDto,
  ): Promise<MedicalEntryResponse> {
    const { record, created } = await this.findOrCreateRecord(petId);

    const entry = this.medicalEntryRepo.create({
      recordId: record.recordId,
      veterinarianId,
      diagnosis: dto.diagnosis,
      treatment: dto.treatment,
      vaccinationStatus: dto.vaccinationStatus,
      medicalDate: dto.medicalDate,
      notes: dto.notes,
    });

    const savedEntry = await this.medicalEntryRepo.save(entry);

    if (created) {
      await this.activityLogRepo.save(
        this.activityLogRepo.create({
          userId: veterinarianId,
          action: 'MEDICAL_RECORD_CREATED',
          entityType: 'MEDICAL_RECORD',
          entityId: record.recordId,
        }),
      );
    }

    return this.findEntry(savedEntry.entryId);
  }

  async updateEntry(
    entryId: string,
    dto: UpdateMedicalEntryDto,
  ): Promise<MedicalEntryResponse> {
    const entry = await this.getEntryEntity(entryId);

    if (dto.diagnosis !== undefined) entry.diagnosis = dto.diagnosis;
    if (dto.treatment !== undefined) entry.treatment = dto.treatment;
    if (dto.vaccinationStatus !== undefined) {
      entry.vaccinationStatus = dto.vaccinationStatus;
    }
    if (dto.notes !== undefined) entry.notes = dto.notes;

    await this.medicalEntryRepo.save(entry);
    return this.findEntry(entryId);
  }

  async removeEntry(entryId: string): Promise<{ message: string }> {
    await this.getEntryEntity(entryId);
    await this.medicalEntryRepo.softDelete(entryId);

    return {
      message: 'Medical entry archived successfully',
    };
  }

  private async getEntryEntity(entryId: string) {
    const entry = await this.medicalEntryRepo.findOne({
      where: { entryId },
      relations: ['veterinarian'],
    });

    if (!entry) {
      throw new NotFoundException('Medical entry not found');
    }

    return entry;
  }

  private async getExistingRecordForPet(petId: string): Promise<MedicalRecord> {
    await this.ensurePetExists(petId);

    const record = await this.medicalRecordRepo.findOne({ where: { petId } });

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    return record;
  }

  private mapRecordResponse(record: MedicalRecord): MedicalRecordResponse {
    return {
      recordId: record.recordId,
      petId: record.petId,
      createdAt: record.createdAt,
      pet: {
        petId: record.pet.petId,
        name: record.pet.petName,
        species: record.pet.species,
        breed: record.pet.breed,
        age: record.pet.age,
        gender: record.pet.gender,
        healthStatus: record.pet.healthStatus,
        adoptionStatus: record.pet.adoptionStatus,
      },
      entries: (record.entries ?? []).map((entry) => this.mapEntryResponse(entry)),
    };
  }

  private mapEntryResponse(entry: MedicalEntry): MedicalEntryResponse {
    return {
      entryId: entry.entryId,
      recordId: entry.recordId,
      diagnosis: entry.diagnosis,
      treatment: entry.treatment,
      vaccinationStatus: entry.vaccinationStatus,
      medicalDate: entry.medicalDate,
      notes: entry.notes,
      createdAt: entry.createdAt,
      veterinarian: this.mapVeterinarianResponse(entry.veterinarian),
    };
  }

  private mapVeterinarianResponse(
    veterinarian: User,
  ): MedicalVeterinarianResponse {
    return {
      userId: veterinarian.userId,
      firstName: veterinarian.firstName,
      lastName: veterinarian.lastName,
      avatar: veterinarian.avatar,
    };
  }

  private async findOrCreateRecord(petId: string) {
    await this.ensurePetExists(petId);

    const existingRecord = await this.medicalRecordRepo.findOne({
      where: { petId },
    });

    if (existingRecord) {
      return { record: existingRecord, created: false };
    }

    try {
      return {
        record: await this.medicalRecordRepo.save(
          this.medicalRecordRepo.create({ petId }),
        ),
        created: true,
      };
    } catch (error) {
      if (!(error instanceof QueryFailedError && (error as any).code === '23505')) {
        throw error;
      }

      const record = await this.medicalRecordRepo.findOne({ where: { petId } });
      if (!record) {
        throw error;
      }
      return { record, created: false };
    }
  }

  private async ensurePetExists(petId: string) {
    const pet = await this.petRepo.findOne({
      where: { petId },
      select: {
        petId: true,
      },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    return pet;
  }
}
