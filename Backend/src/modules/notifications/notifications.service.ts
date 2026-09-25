import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateNotificationDto } from '@shared/dto';
import { NotificationTypeEnum, RolesEnum } from '@shared/enums';
import { In, Repository } from 'typeorm';

import { Notification, User } from '../../database/entities';
import { NotificationsGateway } from './notifications.gateway';

type RequestUser = {
  userId: string;
  email: string;
  role: string;
};

export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async createForUser(
    userId: string,
    dto: CreateNotificationDto,
    emit = true,
  ): Promise<NotificationResponse> {
    const userExists = await this.userRepo.exists({
      where: { userId, status: 'active' },
    });

    if (!userExists) {
      throw new NotFoundException('Notification user not found');
    }

    const notification = await this.notificationRepo.save(
      this.notificationRepo.create({
        userId,
        title: dto.title,
        message: dto.message,
        type: dto.type,
      }),
    );
    const response = this.mapNotification(notification);

    if (emit) {
      this.notificationsGateway.sendToUser(userId, response);
    }

    return response;
  }

  async createChatMessage(senderId: string, adopterUserId: string, fromAdopter: boolean): Promise<void> {
    const sender = await this.userRepo.findOneByOrFail({ userId: senderId });
    const recipients = fromAdopter
      ? await this.userRepo.find({ where: { status: 'active', role: { roleName: In([RolesEnum.EMPLOYEE, RolesEnum.ADMIN, RolesEnum.MANAGER]) } } })
      : await this.userRepo.find({ where: { userId: adopterUserId, status: 'active' } });
    const name = fromAdopter ? `${sender.firstName} ${sender.lastName}`.trim() : 'Petopia Support';
    await Promise.all(recipients.filter(user => user.userId !== senderId).map(user => this.createForUser(user.userId, {
      title: 'New message',
      message: `New message from ${name}`,
      type: NotificationTypeEnum.MESSAGE,
    })));
  }

  async createAdoptionUpdate(
    userId: string,
    title: string,
    message: string,
  ): Promise<NotificationResponse> {
    return this.createForUser(userId, {
      title,
      message,
      type: NotificationTypeEnum.ADOPTION,
    });
  }

  async createAdoptionRequestAlert(
    adopterName: string,
    petName: string,
  ): Promise<NotificationResponse[]> {
    const users = await this.userRepo.find({
      where: {
        status: 'active',
        role: {
          roleName: In([RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.EMPLOYEE]),
        },
      },
      relations: ['role'],
    });

    return Promise.all(
      users.map((user) =>
        this.createForUser(user.userId, {
          title: 'New adoption request',
          message: `${adopterName} submitted an adoption request for ${petName}.`,
          type: NotificationTypeEnum.ADOPTION,
        }),
      ),
    );
  }

  async createInventoryAlert(
    title: string,
    message: string,
  ): Promise<NotificationResponse[]> {
    const users = await this.userRepo.find({
      where: {
        status: 'active',
        role: {
          roleName: In([RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.EMPLOYEE]),
        },
      },
      relations: ['role'],
    });

    return Promise.all(
      users.map((user) =>
        this.createForUser(user.userId, {
          title,
          message,
          type: NotificationTypeEnum.INVENTORY,
        }),
      ),
    );
  }

  async findMine(user: RequestUser): Promise<NotificationResponse[]> {
    const notifications = await this.notificationRepo.find({
      where: { userId: user.userId },
      order: { createdAt: 'DESC' },
    });

    return notifications
      .filter((notification) => this.canViewNotificationType(user.role, notification.type))
      .map((notification) => this.mapNotification(notification));
  }

  async getUnreadCount(user: RequestUser): Promise<{ count: number }> {
    const notifications = await this.notificationRepo.find({
      where: {
        userId: user.userId,
        isRead: false,
      },
    });

    return {
      count: notifications.filter((notification) =>
        this.canViewNotificationType(user.role, notification.type),
      ).length,
    };
  }

  async markAsRead(
    notificationId: string,
    user: RequestUser,
  ): Promise<NotificationResponse> {
    const notification = await this.notificationRepo.findOne({
      where: { notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== user.userId) {
      throw new ForbiddenException('You can only update your own notifications');
    }

    if (!this.canViewNotificationType(user.role, notification.type)) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    const saved = await this.notificationRepo.save(notification);

    return this.mapNotification(saved);
  }

  async markAllAsRead(user: RequestUser): Promise<{ updated: number }> {
    const notifications = await this.notificationRepo.find({
      where: {
        userId: user.userId,
        isRead: false,
      },
    });
    const visibleIds = notifications
      .filter((notification) => this.canViewNotificationType(user.role, notification.type))
      .map((notification) => notification.notificationId);

    if (visibleIds.length === 0) {
      return { updated: 0 };
    }

    const result = await this.notificationRepo.update(
      {
        notificationId: In(visibleIds),
      },
      {
        isRead: true,
      },
    );

    return { updated: result.affected ?? 0 };
  }

  private mapNotification(notification: Notification): NotificationResponse {
    return {
      id: notification.notificationId,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }

  private canViewNotificationType(role: string, type: string): boolean {
    if (type !== NotificationTypeEnum.INVENTORY) {
      return true;
    }

    return [RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.EMPLOYEE].includes(
      role.toUpperCase() as RolesEnum,
    );
  }
}
