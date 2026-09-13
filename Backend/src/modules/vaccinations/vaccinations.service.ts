import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  CreateVaccinationDto,
  UpdateVaccinationDto,
} from '@shared/dto/vaccination.dto';
import { Pet } from '../../database/entities/pet.entity';
import { MedicalRecord } from '../../database/entities/medical-record.entity';
import { User } from '../../database/entities/user.entity';
import { Vaccination } from '../../database/entities/vaccination.entity';
import { VaccineStatusEnum } from '@shared/enums/vaccine-status.enum';

interface VaccinationPetResponse {
  petId: string;
  name: string;
  species: string;
}

interface VaccinationVeterinarianResponse {
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
}

interface VaccinationResponse {
  vaccinationId: string;
  petId: string;
  vaccineName: string;
  vaccinationDate: string;
  nextDueDate?: string | null;
  batch?: string | null;
  status: VaccineStatusEnum;
  notes?: string | null;
  pet: VaccinationPetResponse;
  veterinarian: VaccinationVeterinarianResponse;
}

@Injectable()
export class VaccinationsService {
  constructor(
    @InjectRepository(Vaccination)
    private readonly vaccinationRepo: Repository<Vaccination>,

    @InjectRepository(Pet)
    private readonly petRepo: Repository<Pet>,

    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepo: Repository<MedicalRecord>,
  ) {}

  async findByPet(petId: string): Promise<VaccinationResponse[]> {
    await this.ensurePetExists(petId);

    const vaccinations = await this.vaccinationRepo.find({
      where: { petId },
      relations: ['pet', 'veterinarian'],
      order: {
        vaccinationDate: 'DESC',
      },
    });

    return vaccinations.map((vaccination) =>
      this.mapVaccinationResponse(vaccination),
    );
  }

  async create(
    petId: string,
    veterinarianId: string,
    dto: CreateVaccinationDto,
  ): Promise<VaccinationResponse> {
    await this.ensurePetExists(petId);
    await this.ensureMedicalRecordExists(petId);
    this.validateDueDate(dto.vaccinationDate, dto.nextDueDate);

    const vaccination = this.vaccinationRepo.create({
      petId,
      veterinarianId,
      vaccineName: dto.vaccineName,
      vaccinationDate: dto.vaccinationDate,
      nextDueDate: dto.nextDueDate,
      batch: dto.batch,
      status: dto.status ?? VaccineStatusEnum.VACCINATED,
      notes: dto.notes,
    });

    const savedVaccination = await this.vaccinationRepo.save(vaccination);
    const savedVaccinationEntity = await this.getVaccinationEntity(
      savedVaccination.vaccinationId,
    );

    return this.mapVaccinationResponse(savedVaccinationEntity);
  }

  async update(
    vaccinationId: string,
    dto: UpdateVaccinationDto,
  ): Promise<VaccinationResponse> {
    const vaccination = await this.getVaccinationEntity(vaccinationId);

    this.validateDueDate(
      dto.vaccinationDate ?? vaccination.vaccinationDate,
      dto.nextDueDate ?? vaccination.nextDueDate,
    );

    if (dto.vaccineName !== undefined) vaccination.vaccineName = dto.vaccineName;
    if (dto.vaccinationDate !== undefined) {
      vaccination.vaccinationDate = dto.vaccinationDate;
    }
    if (dto.nextDueDate !== undefined) vaccination.nextDueDate = dto.nextDueDate;
    if (dto.batch !== undefined) vaccination.batch = dto.batch;
    if (dto.status !== undefined) vaccination.status = dto.status;
    if (dto.notes !== undefined) vaccination.notes = dto.notes;

    await this.vaccinationRepo.save(vaccination);
    const updatedVaccination = await this.getVaccinationEntity(vaccinationId);
    return this.mapVaccinationResponse(updatedVaccination);
  }

  async remove(vaccinationId: string): Promise<{ message: string }> {
    await this.getVaccinationEntity(vaccinationId);
    await this.vaccinationRepo.softDelete(vaccinationId);

    return {
      message: 'Vaccination archived successfully',
    };
  }

  private async getVaccinationEntity(vaccinationId: string) {
    const vaccination = await this.vaccinationRepo.findOne({
      where: { vaccinationId },
      relations: ['pet', 'veterinarian'],
    });

    if (!vaccination) {
      throw new NotFoundException('Vaccination not found');
    }

    return vaccination;
  }

  private mapVaccinationResponse(
    vaccination: Vaccination,
  ): VaccinationResponse {
    return {
      vaccinationId: vaccination.vaccinationId,
      petId: vaccination.petId,
      vaccineName: vaccination.vaccineName,
      vaccinationDate: vaccination.vaccinationDate,
      nextDueDate: vaccination.nextDueDate,
      batch: vaccination.batch,
      status: vaccination.status,
      notes: vaccination.notes,
      pet: this.mapPetResponse(vaccination.pet),
      veterinarian: this.mapVeterinarianResponse(vaccination.veterinarian),
    };
  }

  private mapPetResponse(pet: Pet): VaccinationPetResponse {
    return {
      petId: pet.petId,
      name: pet.petName,
      species: pet.species,
    };
  }

  private mapVeterinarianResponse(
    veterinarian: User,
  ): VaccinationVeterinarianResponse {
    return {
      userId: veterinarian.userId,
      firstName: veterinarian.firstName,
      lastName: veterinarian.lastName,
      avatar: veterinarian.avatar,
    };
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

  private async ensureMedicalRecordExists(petId: string) {
    const medicalRecord = await this.medicalRecordRepo.findOne({
      where: { petId },
      select: {
        recordId: true,
      },
    });

    if (!medicalRecord) {
      throw new BadRequestException(
        'Pet must have a medical record before adding vaccinations',
      );
    }

    return medicalRecord;
  }

  private validateDueDate(
    vaccinationDate: string,
    nextDueDate?: string | null,
  ): void {
    if (!nextDueDate) return;

    if (new Date(nextDueDate) <= new Date(vaccinationDate)) {
      throw new BadRequestException(
        'Next due date must be after vaccination date',
      );
    }
  }
}
