import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreatePetDto, UpdatePetDto } from '@shared/dto/pet.dto';
import { Pet } from '../../database/entities/pet.entity';
import { PetImage } from '../../database/entities/pet-image.entity';
import { MedicalEntry } from '../../database/entities/medical-entry.entity';
import { MedicalRecord } from '../../database/entities/medical-record.entity';
import { Vaccination } from '../../database/entities/vaccination.entity';

export interface FindPetsQuery {
  search?: string;
  species?: string;
  breed?: string;
  status?: string;
  health?: string;
  minAge?: number;
  maxAge?: number;
}

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet)
    private readonly petRepo: Repository<Pet>,

    @InjectRepository(PetImage)
    private readonly petImageRepo: Repository<PetImage>,

    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepo: Repository<MedicalRecord>,

    @InjectRepository(MedicalEntry)
    private readonly medicalEntryRepo: Repository<MedicalEntry>,

    @InjectRepository(Vaccination)
    private readonly vaccinationRepo: Repository<Vaccination>,
  ) {}

  async create(dto: CreatePetDto, createdBy?: string) {
    const pet = this.petRepo.create({
      petName: dto.name,
      species: dto.species,
      breed: dto.breed,
      age: dto.age,
      gender: dto.gender,
      color: dto.color,
      weight: dto.weight === undefined ? undefined : String(dto.weight),
      description: dto.description,
      createdBy,
    });

    const savedPet = await this.petRepo.save(pet);

    if (dto.image) {
      await this.petImageRepo.save(
        this.petImageRepo.create({
          petId: savedPet.petId,
          imageUrl: dto.image,
        }),
      );
    }

    return this.findOne(savedPet.petId);
  }

  findAll(query: FindPetsQuery) {
    const qb = this.petRepo
      .createQueryBuilder('pet')
      .leftJoinAndSelect('pet.images', 'images')
      .orderBy('pet.createdAt', 'DESC');

    if (query.search) {
      qb.andWhere(
        '(pet.petName ILIKE :search OR pet.species ILIKE :search OR pet.breed ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.species) {
      qb.andWhere('pet.species ILIKE :species', { species: query.species });
    }

    if (query.breed) {
      qb.andWhere('pet.breed ILIKE :breed', { breed: query.breed });
    }

    if (query.status) {
      qb.andWhere('LOWER(pet.adoptionStatus) = LOWER(:status)', {
        status: query.status,
      });
    }

    if (query.health) {
      qb.andWhere('pet.healthStatus ILIKE :health', { health: query.health });
    }

    if (query.minAge !== undefined) {
      qb.andWhere('pet.age >= :minAge', { minAge: query.minAge });
    }

    if (query.maxAge !== undefined) {
      qb.andWhere('pet.age <= :maxAge', { maxAge: query.maxAge });
    }

    return qb.getMany();
  }

  async findOne(id: string) {
    const pet = await this.petRepo.findOne({
      where: { petId: id },
      relations: ['images', 'medicalRecord', 'vaccinations'],
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    return pet;
  }

  async update(id: string, dto: UpdatePetDto) {
    const pet = await this.findOne(id);

    if (dto.name !== undefined) pet.petName = dto.name;
    if (dto.species !== undefined) pet.species = dto.species;
    if (dto.breed !== undefined) pet.breed = dto.breed;
    if (dto.age !== undefined) pet.age = dto.age;
    if (dto.gender !== undefined) pet.gender = dto.gender;
    if (dto.color !== undefined) pet.color = dto.color;
    if (dto.weight !== undefined) pet.weight = String(dto.weight);
    if (dto.description !== undefined) pet.description = dto.description;
    if (dto.adoptionStatus !== undefined) pet.adoptionStatus = dto.adoptionStatus;
    if (dto.healthStatus !== undefined) pet.healthStatus = dto.healthStatus;

    await this.petRepo.save(pet);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);

    const medicalRecord = await this.medicalRecordRepo.findOne({
      where: { petId: id },
      select: {
        recordId: true,
      },
    });

    if (medicalRecord) {
      await this.medicalEntryRepo.softDelete({ recordId: medicalRecord.recordId });
    }

    await this.vaccinationRepo.softDelete({ petId: id });
    await this.petRepo.softDelete(id);

    return {
      message: 'Pet archived successfully',
    };
  }
}
