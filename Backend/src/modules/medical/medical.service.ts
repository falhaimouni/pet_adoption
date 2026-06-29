import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  CreateMedicalEntryDto,
  UpdateMedicalEntryDto,
} from '@shared/dto/medical-record.dto';
import { MedicalEntry } from '../../database/entities/medical-entry.entity';
import { MedicalRecord } from '../../database/entities/medical-record.entity';
import { Pet } from '../../database/entities/pet.entity';

@Injectable()
export class MedicalService {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepo: Repository<MedicalRecord>,

    @InjectRepository(MedicalEntry)
    private readonly medicalEntryRepo: Repository<MedicalEntry>,

    @InjectRepository(Pet)
    private readonly petRepo: Repository<Pet>,
  ) {}

  async findRecordByPet(petId: string) {
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

    return record;
  }

  async findEntriesByPet(petId: string) {
    const record = await this.findRecordByPet(petId);
    return record.entries;
  }

  async addEntry(petId: string, veterinarianId: string, dto: CreateMedicalEntryDto) {
    const record = await this.findOrCreateRecord(petId);

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
    return this.findEntry(savedEntry.entryId);
  }

  async updateEntry(entryId: string, dto: UpdateMedicalEntryDto) {
    const entry = await this.findEntry(entryId);

    if (dto.diagnosis !== undefined) entry.diagnosis = dto.diagnosis;
    if (dto.treatment !== undefined) entry.treatment = dto.treatment;
    if (dto.vaccinationStatus !== undefined) {
      entry.vaccinationStatus = dto.vaccinationStatus;
    }
    if (dto.notes !== undefined) entry.notes = dto.notes;

    await this.medicalEntryRepo.save(entry);
    return this.findEntry(entryId);
  }

  async removeEntry(entryId: string) {
    await this.findEntry(entryId);
    await this.medicalEntryRepo.softDelete(entryId);

    return {
      message: 'Medical entry archived successfully',
    };
  }

  private async findEntry(entryId: string) {
    const entry = await this.medicalEntryRepo.findOne({
      where: { entryId },
      relations: ['medicalRecord', 'medicalRecord.pet', 'veterinarian'],
    });

    if (!entry) {
      throw new NotFoundException('Medical entry not found');
    }

    return entry;
  }

  private async findOrCreateRecord(petId: string) {
    await this.ensurePetExists(petId);

    const existingRecord = await this.medicalRecordRepo.findOne({
      where: { petId },
    });

    if (existingRecord) {
      return existingRecord;
    }

    return this.medicalRecordRepo.save(
      this.medicalRecordRepo.create({
        petId,
      }),
    );
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
