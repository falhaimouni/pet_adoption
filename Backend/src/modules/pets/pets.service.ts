import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CreatePetDto, UpdatePetDto } from '@shared/dto/pet.dto';
import { FindPetsQueryDto } from '@shared/dto/find-pets-query.dto';
import { Pet } from '../../database/entities/pet.entity';
import { PetImage } from '../../database/entities/pet-image.entity';
import { MedicalEntry } from '../../database/entities/medical-entry.entity';
import { MedicalRecord } from '../../database/entities/medical-record.entity';
import { Vaccination } from '../../database/entities/vaccination.entity';
import { Adoption } from '../../database/entities/adoption.entity';
import { FileUpload } from '../../database/entities/file-upload.entity';
import { FileUploadCategory } from '@shared/enums';
import { UploadsService } from '../uploads/uploads.service';

interface PetImageResponse {
  imageId: string;
  fileId: string;
  imageUrl: string;
  uploadedAt: Date;
}

interface PetResponse {
  petId: string;
  name: string;
  species: string;
  breed?: string | null;
  age?: number | null;
  gender?: string | null;
  color?: string | null;
  weight?: number | null;
  description?: string | null;
  healthStatus?: string | null;
  adoptionStatus: string;
  arrivalDate?: string | null;
  images: PetImageResponse[];
}

interface PetFullResponse extends PetResponse {
  medicalRecord?: {
    recordId: string;
    createdAt: Date;
  };
  vaccinations: {
    vaccinationId: string;
    vaccineName: string;
    vaccinationDate: string;
    nextDueDate?: string | null;
  }[];
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

    @InjectRepository(Adoption)
    private readonly adoptionRepo: Repository<Adoption>,

    private readonly dataSource: DataSource,

    private readonly uploadsService: UploadsService,
  ) {}

  async create(dto: CreatePetDto, createdBy?: string): Promise<PetResponse> {
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

    return this.findOne(savedPet.petId);
  }

  async findAll(query: FindPetsQueryDto): Promise<PetResponse[]> {
    const qb = this.petRepo
      .createQueryBuilder('pet')
      .leftJoinAndSelect('pet.images', 'images')
      .leftJoinAndSelect('images.file', 'imageFile')
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

    const pets = await qb.getMany();
    return pets.map((pet) => this.mapPetResponse(pet));
  }

  async findOne(id: string): Promise<PetResponse> {
    const pet = await this.petRepo
      .createQueryBuilder('pet')
      .leftJoinAndSelect('pet.images', 'images')
      .leftJoinAndSelect('images.file', 'imageFile')
      .where('pet.petId = :id', { id })
      .getOne();

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    return this.mapPetResponse(pet);
  }

  async findFull(id: string): Promise<PetFullResponse> {
    const pet = await this.petRepo
      .createQueryBuilder('pet')
      .leftJoinAndSelect('pet.images', 'images')
      .leftJoinAndSelect('images.file', 'imageFile')
      .leftJoinAndSelect('pet.medicalRecord', 'medicalRecord')
      .leftJoinAndSelect(
        'pet.vaccinations',
        'vaccinations',
        'vaccinations.deletedAt IS NULL',
      )
      .where('pet.petId = :id', { id })
      .getOne();

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    return this.mapPetFullResponse(pet);
  }

  async update(id: string, dto: UpdatePetDto): Promise<PetResponse> {
    await this.dataSource.transaction(async (manager) => {
      const pet = await manager
        .getRepository(Pet)
        .createQueryBuilder('pet')
        .setLock('pessimistic_write')
        .where('pet.petId = :id', { id })
        .getOne();

      if (!pet) {
        throw new NotFoundException('Pet not found');
      }

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

      await manager.getRepository(Pet).save(pet);
    });

    return this.findOne(id);
  }

  async uploadPetImage(
    petId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<PetImageResponse> {
    let uploadedFile: FileUpload | undefined;

    try {
      await this.getPetEntity(petId);

      uploadedFile = await this.uploadsService.createFileRecord(
        file,
        FileUploadCategory.PET_IMAGE,
        userId,
      );

      const image = await this.petImageRepo.save(
        this.petImageRepo.create({
          petId,
          fileId: uploadedFile.fileId,
        }),
      );

      image.file = uploadedFile;
      return this.mapPetImageResponse(image);
    } catch (error) {
      await this.uploadsService.rollbackFileUpload(
        file.path,
        uploadedFile?.fileId,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.dataSource.transaction(async (manager) => {
      const petRepo = manager.getRepository(Pet);
      const pet = await petRepo
        .createQueryBuilder('pet')
        .setLock('pessimistic_write')
        .where('pet.petId = :id', { id })
        .getOne();

      if (!pet) {
        throw new NotFoundException('Pet not found');
      }

      const completedAdoption = await manager
        .getRepository(Adoption)
        .createQueryBuilder('adoption')
        .innerJoin('adoption.request', 'request')
        .where('request.petId = :petId', { petId: id })
        .getExists();

      if (completedAdoption) {
        throw new BadRequestException(
          'Cannot archive a pet that has completed adoptions',
        );
      }

      const medicalRecord = await manager.getRepository(MedicalRecord).findOne({
        where: { petId: id },
        select: { recordId: true },
      });

      if (medicalRecord) {
        await manager
          .getRepository(MedicalEntry)
          .softDelete({ recordId: medicalRecord.recordId });
      }

      await manager.getRepository(Vaccination).softDelete({ petId: id });
      await manager.getRepository(PetImage).delete({ petId: id });
      await petRepo.softDelete(id);
    });

    return {
      message: 'Pet archived successfully',
    };
  }

  private async getPetEntity(id: string): Promise<Pet> {
    const pet = await this.petRepo.findOne({
      where: { petId: id },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    return pet;
  }

  private mapPetResponse(pet: Pet): PetResponse {
    return {
      petId: pet.petId,
      name: pet.petName,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      gender: pet.gender,
      color: pet.color,
      weight: this.mapWeight(pet.weight),
      description: pet.description,
      healthStatus: pet.healthStatus,
      adoptionStatus: pet.adoptionStatus,
      arrivalDate: pet.arrivalDate,
      images: (pet.images ?? []).map((image) => this.mapPetImageResponse(image)),
    };
  }

  private mapPetFullResponse(pet: Pet): PetFullResponse {
    return {
      ...this.mapPetResponse(pet),
      medicalRecord: pet.medicalRecord
        ? {
            recordId: pet.medicalRecord.recordId,
            createdAt: pet.medicalRecord.createdAt,
          }
        : undefined,
      vaccinations: (pet.vaccinations ?? []).map((vaccination) => ({
        vaccinationId: vaccination.vaccinationId,
        vaccineName: vaccination.vaccineName,
        vaccinationDate: vaccination.vaccinationDate,
        nextDueDate: vaccination.nextDueDate,
      })),
    };
  }

  private mapPetImageResponse(image: PetImage): PetImageResponse {
    return {
      imageId: image.imageId,
      fileId: image.fileId,
      imageUrl: image.file.fileUrl,
      uploadedAt: image.uploadedAt,
    };
  }

  private mapWeight(weight?: string | null): number | null {
    return weight === undefined || weight === null ? null : Number(weight);
  }
}
