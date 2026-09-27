import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { OrderItemDto } from './order-item.dto';
import type { PaymentDto } from './payment.dto';
import { OrderStatusEnum } from '../enums/order-status.enum';

export interface OrderDto {
  orderId: string;
  orderReference: string;
  userId: string;
  totalPrice: string;
  recipientName: string;
  phoneNumber: string;
  addressLine: string;
  city: string;
  postalCode: string | null;
  deliveryNotes: string | null;
  orderStatus: OrderStatusEnum;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItemDto[];
  payments: PaymentDto[];
}

export class CreateOrderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  recipientName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  phoneNumber!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  addressLine!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryNotes?: string;
}