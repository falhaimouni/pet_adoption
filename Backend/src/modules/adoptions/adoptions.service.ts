import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { CreateAdoptionRequestDto } from '@shared/dto/adoption-request.dto';
import { DataSource, Repository } from 'typeorm';

import { AdoptionRequest } from '../../database/entities/adoption-request.entity';
import { Adoption } from '../../database/entities/adoption.entity';
import { Adopter } from '../../database/entities/adopter.entity';
import { Pet } from '../../database/entities/pet.entity';

const ADOPTION_REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

const PET_ADOPTION_STATUS = {
  AVAILABLE: 'AVAILABLE',
  PENDING: 'PENDING',
  ADOPTED: 'ADOPTED',
} as const;

const CONTRACT_STATUS = {
  PENDING: 'PENDING',
} as const;

type RequestUser = {
  userId: string;
  email: string;
  role: string;
};

interface AdoptionRequestResponse {
  requestId: string;
  status: string;
  notes?: string | null;
  requestDate: string;
  reviewedBy?: string | null;
  adopter: {
    adopterId: string;
    userId: string;
    firstName: string;
    lastName: string;
  };
  pet: {
    petId: string;
    name: string;
    species: string;
    adoptionStatus: string;
  };
  adoption?: {
    adoptionId: string;
    adoptionDate: string;
    adoptionFee?: number | null;
    contractStatus: string;
  };
}

@Injectable()
export class AdoptionsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    @InjectRepository(AdoptionRequest)
    private readonly adoptionRequestRepo: Repository<AdoptionRequest>,

    @InjectRepository(Adopter)
    private readonly adopterRepo: Repository<Adopter>,

    @InjectRepository(Pet)
    private readonly petRepo: Repository<Pet>,
  ) {}

  async findRequests(user: RequestUser): Promise<AdoptionRequestResponse[]> {
    const where =
      user.role === 'ADOPTER'
        ? { adopter: { userId: user.userId } }
        : undefined;

    const requests = await this.adoptionRequestRepo.find({
      where,
      relations: ['adopter', 'adopter.user', 'pet', 'adoption'],
      order: {
        requestDate: 'DESC',
      },
    });

    return requests.map((request) => this.mapRequestResponse(request));
  }

  async findRequest(
    requestId: string,
    user: RequestUser,
  ): Promise<AdoptionRequestResponse> {
    const request = await this.getRequestEntity(requestId);

    if (user.role === 'ADOPTER' && request.adopter.userId !== user.userId) {
      throw new ForbiddenException('You can only view your own adoption requests');
    }

    return this.mapRequestResponse(request);
  }

  async createRequest(
    userId: string,
    dto: CreateAdoptionRequestDto,
  ): Promise<AdoptionRequestResponse> {
    let requestId = '';

    await this.dataSource.transaction(async (manager) => {
      const adopterRepo = manager.getRepository(Adopter);
      const petRepo = manager.getRepository(Pet);
      const requestRepo = manager.getRepository(AdoptionRequest);

      const adopter = await adopterRepo.findOne({
        where: { userId },
      });

      if (!adopter) {
        throw new NotFoundException('Adopter profile not found');
      }

      const pet = await petRepo.findOne({
        where: { petId: dto.petId },
      });

      if (!pet) {
        throw new NotFoundException('Pet not found');
      }

      if (!this.isStatus(pet.adoptionStatus, PET_ADOPTION_STATUS.AVAILABLE)) {
        throw new BadRequestException('Pet is not available for adoption');
      }

      const existingRequest = await requestRepo.findOne({
        where: {
          adopterId: adopter.adopterId,
          petId: pet.petId,
        },
      });

      if (
        existingRequest &&
        [
          ADOPTION_REQUEST_STATUS.PENDING,
          ADOPTION_REQUEST_STATUS.APPROVED,
        ].includes(
          this.normalizeStatus(existingRequest.status) as
            | typeof ADOPTION_REQUEST_STATUS.PENDING
            | typeof ADOPTION_REQUEST_STATUS.APPROVED,
        )
      ) {
        throw new ConflictException('Adoption request already exists');
      }

      const today = this.today();
      const request =
        existingRequest ??
        requestRepo.create({
          adopterId: adopter.adopterId,
          petId: pet.petId,
        });

      request.status = ADOPTION_REQUEST_STATUS.PENDING;
      request.notes = dto.notes;
      request.requestDate = today;
      request.reviewedBy = null;

      pet.adoptionStatus = PET_ADOPTION_STATUS.PENDING;

      const savedRequest = await requestRepo.save(request);
      await petRepo.save(pet);
      requestId = savedRequest.requestId;
    });

    return this.findRequest(requestId, {
      userId,
      email: '',
      role: 'ADOPTER',
    });
  }

  async approveRequest(
    requestId: string,
    reviewerId: string,
  ): Promise<AdoptionRequestResponse> {
    await this.dataSource.transaction(async (manager) => {
      const requestRepo = manager.getRepository(AdoptionRequest);
      const adoptionRepo = manager.getRepository(Adoption);
      const petRepo = manager.getRepository(Pet);

      const request = await requestRepo.findOne({
        where: { requestId },
        relations: ['pet'],
      });

      if (!request) {
        throw new NotFoundException('Adoption request not found');
      }

      if (!this.isStatus(request.status, ADOPTION_REQUEST_STATUS.PENDING)) {
        throw new BadRequestException('Only pending requests can be approved');
      }

      if (this.isStatus(request.pet.adoptionStatus, PET_ADOPTION_STATUS.ADOPTED)) {
        throw new BadRequestException('Pet is already adopted');
      }

      request.status = ADOPTION_REQUEST_STATUS.APPROVED;
      request.reviewedBy = reviewerId;
      await requestRepo.save(request);

      const existingAdoption = await adoptionRepo.findOne({
        where: { requestId },
      });

      if (!existingAdoption) {
        await adoptionRepo.save(
          adoptionRepo.create({
            requestId,
            adoptionDate: this.today(),
            contractStatus: CONTRACT_STATUS.PENDING,
          }),
        );
      }

      request.pet.adoptionStatus = PET_ADOPTION_STATUS.ADOPTED;
      await petRepo.save(request.pet);

      await requestRepo
        .createQueryBuilder()
        .update(AdoptionRequest)
        .set({
          status: ADOPTION_REQUEST_STATUS.REJECTED,
          reviewedBy: reviewerId,
        })
        .where('pet_id = :petId', { petId: request.petId })
        .andWhere('request_id != :requestId', { requestId })
        .andWhere('LOWER(status) = :status', { status: 'pending' })
        .execute();
    });

    return this.findRequest(requestId, {
      userId: reviewerId,
      email: '',
      role: 'ADMIN',
    });
  }

  async cancelRequest(
    requestId: string,
    userId: string,
  ): Promise<AdoptionRequestResponse> {
    await this.dataSource.transaction(async (manager) => {
      const requestRepo = manager.getRepository(AdoptionRequest);
      const petRepo = manager.getRepository(Pet);

      const request = await requestRepo.findOne({
        where: { requestId },
        relations: ['adopter', 'pet'],
      });

      if (!request) {
        throw new NotFoundException('Adoption request not found');
      }

      if (request.adopter.userId !== userId) {
        throw new ForbiddenException('You can only cancel your own adoption requests');
      }

      if (!this.isStatus(request.status, ADOPTION_REQUEST_STATUS.PENDING)) {
        throw new BadRequestException('Only pending requests can be cancelled');
      }

      request.status = ADOPTION_REQUEST_STATUS.CANCELLED;
      await requestRepo.save(request);

      await this.updatePetAvailabilityIfNoPendingRequests(
        requestRepo,
        petRepo,
        request.pet,
      );
    });

    return this.findRequest(requestId, {
      userId,
      email: '',
      role: 'ADOPTER',
    });
  }

  async rejectRequest(
    requestId: string,
    reviewerId: string,
  ): Promise<AdoptionRequestResponse> {
    await this.dataSource.transaction(async (manager) => {
      const requestRepo = manager.getRepository(AdoptionRequest);
      const petRepo = manager.getRepository(Pet);

      const request = await requestRepo.findOne({
        where: { requestId },
        relations: ['pet'],
      });

      if (!request) {
        throw new NotFoundException('Adoption request not found');
      }

      if (!this.isStatus(request.status, ADOPTION_REQUEST_STATUS.PENDING)) {
        throw new BadRequestException('Only pending requests can be rejected');
      }

      request.status = ADOPTION_REQUEST_STATUS.REJECTED;
      request.reviewedBy = reviewerId;
      await requestRepo.save(request);

      await this.updatePetAvailabilityIfNoPendingRequests(
        requestRepo,
        petRepo,
        request.pet,
      );
    });

    return this.findRequest(requestId, {
      userId: reviewerId,
      email: '',
      role: 'ADMIN',
    });
  }

  private async getRequestEntity(requestId: string): Promise<AdoptionRequest> {
    const request = await this.adoptionRequestRepo.findOne({
      where: { requestId },
      relations: ['adopter', 'adopter.user', 'pet', 'adoption'],
    });

    if (!request) {
      throw new NotFoundException('Adoption request not found');
    }

    return request;
  }

  private mapRequestResponse(
    request: AdoptionRequest,
  ): AdoptionRequestResponse {
    return {
      requestId: request.requestId,
      status: request.status,
      notes: request.notes,
      requestDate: request.requestDate,
      reviewedBy: request.reviewedBy,
      adopter: {
        adopterId: request.adopter.adopterId,
        userId: request.adopter.userId,
        firstName: request.adopter.user.firstName,
        lastName: request.adopter.user.lastName,
      },
      pet: {
        petId: request.pet.petId,
        name: request.pet.petName,
        species: request.pet.species,
        adoptionStatus: request.pet.adoptionStatus,
      },
      adoption: request.adoption
        ? {
            adoptionId: request.adoption.adoptionId,
            adoptionDate: request.adoption.adoptionDate,
            adoptionFee: this.mapDecimal(request.adoption.adoptionFee),
            contractStatus: request.adoption.contractStatus,
          }
        : undefined,
    };
  }

  private async updatePetAvailabilityIfNoPendingRequests(
    requestRepo: Repository<AdoptionRequest>,
    petRepo: Repository<Pet>,
    pet: Pet,
  ): Promise<void> {
    const pendingCount = await requestRepo
      .createQueryBuilder('request')
      .where('request.petId = :petId', { petId: pet.petId })
      .andWhere('LOWER(request.status) = :status', { status: 'pending' })
      .getCount();

    if (
      pendingCount === 0 &&
      !this.isStatus(pet.adoptionStatus, PET_ADOPTION_STATUS.ADOPTED)
    ) {
      pet.adoptionStatus = PET_ADOPTION_STATUS.AVAILABLE;
      await petRepo.save(pet);
    }
  }

  private isStatus(value: string, expected: string): boolean {
    return this.normalizeStatus(value) === expected;
  }

  private normalizeStatus(value: string): string {
    return value.toUpperCase();
  }

  private mapDecimal(value?: string | null): number | null {
    return value === undefined || value === null ? null : Number(value);
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }
}
