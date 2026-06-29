import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  CreateVaccinationDto,
  UpdateVaccinationDto,
} from '@shared/dto/vaccination.dto';
import { Pet } from '../../database/entities/pet.entity';
import { Vaccination } from '../../database/entities/vaccination.entity';

@Injectable()
export class VaccinationsService {
  constructor(
    @InjectRepository(Vaccination)
    private readonly vaccinationRepo: Repository<Vaccination>,

    @InjectRepository(Pet)
    private readonly petRepo: Repository<Pet>,
  ) {}

  async findByPet(petId: string) {
    await this.ensurePetExists(petId);

    return this.vaccinationRepo.find({
      where: { petId },
      relations: ['pet', 'veterinarian'],
      order: {
        vaccinationDate: 'DESC',
      },
    });
  }

  async create(petId: string, veterinarianId: string, dto: CreateVaccinationDto) {
    await this.ensurePetExists(petId);

    const vaccination = this.vaccinationRepo.create({
      petId,
      veterinarianId,
      vaccineName: dto.vaccineName,
      vaccinationDate: dto.vaccinationDate,
      nextDueDate: dto.nextDueDate,
    });

    const savedVaccination = await this.vaccinationRepo.save(vaccination);
    return this.findOne(savedVaccination.vaccinationId);
  }

  async update(vaccinationId: string, dto: UpdateVaccinationDto) {
    const vaccination = await this.findOne(vaccinationId);

    if (dto.vaccineName !== undefined) vaccination.vaccineName = dto.vaccineName;
    if (dto.vaccinationDate !== undefined) {
      vaccination.vaccinationDate = dto.vaccinationDate;
    }
    if (dto.nextDueDate !== undefined) vaccination.nextDueDate = dto.nextDueDate;

    await this.vaccinationRepo.save(vaccination);
    return this.findOne(vaccinationId);
  }

  async remove(vaccinationId: string) {
    await this.findOne(vaccinationId);
    await this.vaccinationRepo.softDelete(vaccinationId);

    return {
      message: 'Vaccination archived successfully',
    };
  }

  private async findOne(vaccinationId: string) {
    const vaccination = await this.vaccinationRepo.findOne({
      where: { vaccinationId },
      relations: ['pet', 'veterinarian'],
    });

    if (!vaccination) {
      throw new NotFoundException('Vaccination not found');
    }

    return vaccination;
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
