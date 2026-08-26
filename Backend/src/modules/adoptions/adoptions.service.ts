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

import { ActivityLog } from '../../database/entities/activity-log.entity';
import { AdoptionRequest } from '../../database/entities/adoption-request.entity';
import { Adoption } from '../../database/entities/adoption.entity';
import { Adopter } from '../../database/entities/adopter.entity';
import { Pet } from '../../database/entities/pet.entity';
import { User } from '../../database/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

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

const ACTIVITY_ENTITY = {
  ADOPTION_REQUEST: 'ADOPTION_REQUEST',
  ADOPTION: 'ADOPTION',
  PET: 'PET',
} as const;

const ACTIVITY_ACTION = {
  REQUEST_CREATED: 'ADOPTION_REQUEST_CREATED',
  REQUEST_APPROVED: 'ADOPTION_REQUEST_APPROVED',
  REQUEST_REJECTED: 'ADOPTION_REQUEST_REJECTED',
  REQUEST_CANCELLED: 'ADOPTION_REQUEST_CANCELLED',
  ADOPTION_CREATED: 'ADOPTION_CREATED',
  PET_STATUS_CHANGED: 'PET_STATUS_CHANGED',
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
  reviewer?: {
    userId: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  } | null;
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

interface AdoptionResponse {
  adoptionId: string;
  requestId: string;
  adoptionDate: string;
  adoptionFee?: number | null;
  contractStatus: string;
  request: {
    requestId: string;
    status: string;
    requestDate: string;
    reviewedBy?: string | null;
    reviewer?: {
      userId: string;
      firstName: string;
      lastName: string;
      avatar?: string | null;
    } | null;
  };
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
}

@Injectable()
export class AdoptionsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    @InjectRepository(AdoptionRequest)
    private readonly adoptionRequestRepo: Repository<AdoptionRequest>,

    @InjectRepository(Adoption)
    private readonly adoptionRepo: Repository<Adoption>,

    @InjectRepository(Adopter)
    private readonly adopterRepo: Repository<Adopter>,

    @InjectRepository(Pet)
    private readonly petRepo: Repository<Pet>,

    private readonly notificationsService: NotificationsService,
  ) {}

  async findRequests(user: RequestUser): Promise<AdoptionRequestResponse[]> {
    const where =
      user.role === 'ADOPTER'
        ? { adopter: { userId: user.userId } }
        : undefined;

    const requests = await this.adoptionRequestRepo.find({
      where,
      relations: ['adopter', 'adopter.user', 'pet', 'adoption', 'reviewer'],
      order: {
        requestDate: 'DESC',
      },
    });

    return requests.map((request) => this.mapRequestResponse(request));
  }

  async findAdoptions(user: RequestUser): Promise<AdoptionResponse[]> {
    const qb = this.adoptionRepo
      .createQueryBuilder('adoption')
      .leftJoinAndSelect('adoption.request', 'request')
      .leftJoinAndSelect('request.adopter', 'adopter')
      .leftJoinAndSelect('adopter.user', 'adopterUser')
      .leftJoinAndSelect('request.pet', 'pet')
      .leftJoinAndSelect('request.reviewer', 'reviewer')
      .orderBy('adoption.adoptionDate', 'DESC');

    if (user.role === 'ADOPTER') {
      qb.where('adopter.userId = :userId', { userId: user.userId });
    }

    const adoptions = await qb.getMany();
    return adoptions.map((adoption) => this.mapAdoptionResponse(adoption));
  }

  async findRequest(
    requestId: string,
    user: RequestUser,
  ): Promise<AdoptionRequestResponse> {
    const request = await this.getRequestEntity(requestId);

    this.assertCanAccessRequest(request, user);

    return this.mapRequestResponse(request);
  }

  async createRequest(
    userId: string,
    dto: CreateAdoptionRequestDto,
  ): Promise<AdoptionRequestResponse> {
    return this.dataSource.transaction(async (manager) => {
      const adopterRepo = manager.getRepository(Adopter);
      const petRepo = manager.getRepository(Pet);
      const requestRepo = manager.getRepository(AdoptionRequest);
      const logRepo = manager.getRepository(ActivityLog);

      const adopter = await adopterRepo.findOne({
        where: { userId },
        relations: ['user'],
      });

      if (!adopter) {
        throw new NotFoundException('Adopter profile not found');
      }

      const pet = await petRepo
        .createQueryBuilder('pet')
        .setLock('pessimistic_write')
        .where('pet.petId = :petId', { petId: dto.petId })
        .getOne();

      if (!pet) {
        throw new NotFoundException('Pet not found');
      }

      if (this.isStatus(pet.adoptionStatus, PET_ADOPTION_STATUS.ADOPTED)) {
        throw new BadRequestException('Pet is already adopted');
      }

      if (!this.isStatus(pet.adoptionStatus, PET_ADOPTION_STATUS.AVAILABLE)) {
        throw new BadRequestException('Pet is not available for adoption');
      }

      const existingRequest = await requestRepo
        .createQueryBuilder('request')
        .setLock('pessimistic_write')
        .where('request.adopterId = :adopterId', {
          adopterId: adopter.adopterId,
        })
        .andWhere('request.petId = :petId', { petId: pet.petId })
        .getOne();

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

      await this.logActivity(
        logRepo,
        userId,
        ACTIVITY_ACTION.REQUEST_CREATED,
        ACTIVITY_ENTITY.ADOPTION_REQUEST,
        savedRequest.requestId,
      );
      await this.logActivity(
        logRepo,
        userId,
        ACTIVITY_ACTION.PET_STATUS_CHANGED,
        ACTIVITY_ENTITY.PET,
        pet.petId,
      );

      savedRequest.adopter = adopter;
      savedRequest.pet = pet;
      savedRequest.reviewer = null;
      savedRequest.adoption = undefined;

      return this.mapRequestResponse(savedRequest);
    });
  }

  async approveRequest(
    requestId: string,
    reviewer: RequestUser,
  ): Promise<AdoptionRequestResponse> {
    this.assertCanReviewRequests(reviewer);

    await this.dataSource.transaction(async (manager) => {
      const requestRepo = manager.getRepository(AdoptionRequest);
      const adoptionRepo = manager.getRepository(Adoption);
      const petRepo = manager.getRepository(Pet);
      const logRepo = manager.getRepository(ActivityLog);

      const requestIdentity = await requestRepo.findOne({
        where: { requestId },
        select: { requestId: true, petId: true },
      });

      if (!requestIdentity) {
        throw new NotFoundException('Adoption request not found');
      }

      const pet = await petRepo
        .createQueryBuilder('pet')
        .setLock('pessimistic_write')
        .where('pet.petId = :petId', { petId: requestIdentity.petId })
        .getOne();

      if (!pet) {
        throw new NotFoundException('Pet not found');
      }

      const request = await requestRepo
        .createQueryBuilder('request')
        .setLock('pessimistic_write')
        .where('request.requestId = :requestId', { requestId })
        .getOne();

      if (!request) {
        throw new NotFoundException('Adoption request not found');
      }

      if (!this.isStatus(request.status, ADOPTION_REQUEST_STATUS.PENDING)) {
        throw new BadRequestException('Only pending requests can be approved');
      }

      if (this.isStatus(pet.adoptionStatus, PET_ADOPTION_STATUS.ADOPTED)) {
        throw new BadRequestException('Pet is already adopted');
      }

      const pendingRequestsForPet = await requestRepo
        .createQueryBuilder('pendingRequest')
        .setLock('pessimistic_write')
        .where('pendingRequest.petId = :petId', { petId: request.petId })
        .andWhere('LOWER(pendingRequest.status) = :status', {
          status: 'pending',
        })
        .getMany();

      request.status = ADOPTION_REQUEST_STATUS.APPROVED;
      request.reviewedBy = reviewer.userId;
      await requestRepo.save(request);

      const existingAdoption = await adoptionRepo.findOne({
        where: { requestId },
      });

      if (!existingAdoption) {
        const adoption = await adoptionRepo.save(
          adoptionRepo.create({
            requestId,
            adoptionDate: this.today(),
            adoptionFee: null,
            contractStatus: CONTRACT_STATUS.PENDING,
          }),
        );

        await this.logActivity(
          logRepo,
          reviewer.userId,
          ACTIVITY_ACTION.ADOPTION_CREATED,
          ACTIVITY_ENTITY.ADOPTION_REQUEST,
          requestId,
        );
        await this.logActivity(
          logRepo,
          reviewer.userId,
          ACTIVITY_ACTION.ADOPTION_CREATED,
          ACTIVITY_ENTITY.ADOPTION,
          adoption.adoptionId,
        );
      }

      pet.adoptionStatus = PET_ADOPTION_STATUS.ADOPTED;
      await petRepo.save(pet);

      const competingRequests = pendingRequestsForPet.filter(
        (pendingRequest) => pendingRequest.requestId !== requestId,
      );

      for (const competingRequest of competingRequests) {
        competingRequest.status = ADOPTION_REQUEST_STATUS.REJECTED;
        competingRequest.reviewedBy = reviewer.userId;
      }

      if (competingRequests.length > 0) {
        await requestRepo.save(competingRequests);
      }

      await this.logActivity(
        logRepo,
        reviewer.userId,
        ACTIVITY_ACTION.REQUEST_APPROVED,
        ACTIVITY_ENTITY.ADOPTION_REQUEST,
        requestId,
      );
      await this.logActivity(
        logRepo,
        reviewer.userId,
        ACTIVITY_ACTION.PET_STATUS_CHANGED,
        ACTIVITY_ENTITY.PET,
        pet.petId,
      );
    });

    const updatedRequest = await this.findRequest(requestId, {
      userId: reviewer.userId,
      email: reviewer.email,
      role: reviewer.role,
    });

    await this.notifyAdoptionUpdate(
      updatedRequest,
      'Adoption request approved',
      `Your adoption request for ${updatedRequest.pet.name} was approved.`,
    );

    return updatedRequest;
  }

  async cancelRequest(
    requestId: string,
    userId: string,
  ): Promise<AdoptionRequestResponse> {
    await this.dataSource.transaction(async (manager) => {
      const requestRepo = manager.getRepository(AdoptionRequest);
      const adopterRepo = manager.getRepository(Adopter);
      const petRepo = manager.getRepository(Pet);
      const logRepo = manager.getRepository(ActivityLog);

      const requestIdentity = await requestRepo.findOne({
        where: { requestId },
        select: { requestId: true, petId: true },
      });

      if (!requestIdentity) {
        throw new NotFoundException('Adoption request not found');
      }

      const pet = await petRepo
        .createQueryBuilder('pet')
        .setLock('pessimistic_write')
        .where('pet.petId = :petId', { petId: requestIdentity.petId })
        .getOne();

      if (!pet) {
        throw new NotFoundException('Pet not found');
      }

      const request = await requestRepo
        .createQueryBuilder('request')
        .setLock('pessimistic_write')
        .where('request.requestId = :requestId', { requestId })
        .getOne();

      if (!request) {
        throw new NotFoundException('Adoption request not found');
      }

      const adopter = await adopterRepo.findOne({
        where: { adopterId: request.adopterId },
        select: {
          adopterId: true,
          userId: true,
        },
      });

      if (!adopter) {
        throw new NotFoundException('Adopter profile not found');
      }

      if (adopter.userId !== userId) {
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
        pet,
      );

      await this.logActivity(
        logRepo,
        userId,
        ACTIVITY_ACTION.REQUEST_CANCELLED,
        ACTIVITY_ENTITY.ADOPTION_REQUEST,
        requestId,
      );
    });

    const updatedRequest = await this.findRequest(requestId, {
      userId,
      email: '',
      role: 'ADOPTER',
    });

    await this.notifyAdoptionUpdate(
      updatedRequest,
      'Adoption request cancelled',
      `Your adoption request for ${updatedRequest.pet.name} was cancelled.`,
    );

    return updatedRequest;
  }

  async rejectRequest(
    requestId: string,
    reviewer: RequestUser,
  ): Promise<AdoptionRequestResponse> {
    this.assertCanReviewRequests(reviewer);

    await this.dataSource.transaction(async (manager) => {
      const requestRepo = manager.getRepository(AdoptionRequest);
      const petRepo = manager.getRepository(Pet);
      const logRepo = manager.getRepository(ActivityLog);

      const request = await requestRepo
        .createQueryBuilder('request')
        .setLock('pessimistic_write')
        .where('request.requestId = :requestId', { requestId })
        .getOne();

      if (!request) {
        throw new NotFoundException('Adoption request not found');
      }

      if (!this.isStatus(request.status, ADOPTION_REQUEST_STATUS.PENDING)) {
        throw new BadRequestException('Only pending requests can be rejected');
      }

      const pet = await petRepo
        .createQueryBuilder('pet')
        .setLock('pessimistic_write')
        .where('pet.petId = :petId', { petId: request.petId })
        .getOne();

      if (!pet) {
        throw new NotFoundException('Pet not found');
      }

      request.status = ADOPTION_REQUEST_STATUS.REJECTED;
      request.reviewedBy = reviewer.userId;
      await requestRepo.save(request);
      await this.updatePetAvailabilityIfNoPendingRequests(
        requestRepo,
        petRepo,
        pet,
      );

      await this.logActivity(
        logRepo,
        reviewer.userId,
        ACTIVITY_ACTION.REQUEST_REJECTED,
        ACTIVITY_ENTITY.ADOPTION_REQUEST,
        requestId,
      );
    });

    const updatedRequest = await this.findRequest(requestId, {
      userId: reviewer.userId,
      email: reviewer.email,
      role: reviewer.role,
    });

    await this.notifyAdoptionUpdate(
      updatedRequest,
      'Adoption request rejected',
      `Your adoption request for ${updatedRequest.pet.name} was rejected.`,
    );

    return updatedRequest;
  }

  private async getRequestEntity(requestId: string): Promise<AdoptionRequest> {
    const request = await this.adoptionRequestRepo.findOne({
      where: { requestId },
      relations: ['adopter', 'adopter.user', 'pet', 'adoption', 'reviewer'],
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
      reviewer: request.reviewer
        ? this.mapReviewerResponse(request.reviewer)
        : null,
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

  private mapAdoptionResponse(adoption: Adoption): AdoptionResponse {
    return {
      adoptionId: adoption.adoptionId,
      requestId: adoption.requestId,
      adoptionDate: adoption.adoptionDate,
      adoptionFee: this.mapDecimal(adoption.adoptionFee),
      contractStatus: adoption.contractStatus,
      request: {
        requestId: adoption.request.requestId,
        status: adoption.request.status,
        requestDate: adoption.request.requestDate,
        reviewedBy: adoption.request.reviewedBy,
        reviewer: adoption.request.reviewer
          ? this.mapReviewerResponse(adoption.request.reviewer)
          : null,
      },
      adopter: {
        adopterId: adoption.request.adopter.adopterId,
        userId: adoption.request.adopter.userId,
        firstName: adoption.request.adopter.user.firstName,
        lastName: adoption.request.adopter.user.lastName,
      },
      pet: {
        petId: adoption.request.pet.petId,
        name: adoption.request.pet.petName,
        species: adoption.request.pet.species,
        adoptionStatus: adoption.request.pet.adoptionStatus,
      },
    };
  }

  private mapReviewerResponse(reviewer: User) {
    return {
      userId: reviewer.userId,
      firstName: reviewer.firstName,
      lastName: reviewer.lastName,
      avatar: reviewer.avatar,
    };
  }

  private async notifyAdoptionUpdate(
    request: AdoptionRequestResponse,
    title: string,
    message: string,
  ): Promise<void> {
    await this.notificationsService.createAdoptionUpdate(
      request.adopter.userId,
      title,
      message,
    );
  }

  private assertCanAccessRequest(
    request: AdoptionRequest,
    user: RequestUser,
  ): void {
    if (user.role === 'ADOPTER' && request.adopter.userId !== user.userId) {
      throw new ForbiddenException('You can only view your own adoption requests');
    }
  }

  private assertCanReviewRequests(user: RequestUser): void {
    if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(user.role)) {
      throw new ForbiddenException('You cannot review adoption requests');
    }
  }

  private async logActivity(
    logRepo: Repository<ActivityLog>,
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string,
  ): Promise<void> {
    await logRepo.save(
      logRepo.create({
        userId,
        action,
        entityType,
        entityId,
      }),
    );
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
