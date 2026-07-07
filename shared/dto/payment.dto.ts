import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { PaymentMethodEnum } from '../enums/payment-method.enum';
import { PaymentStatusEnum } from '../enums/payment-status.enum';

export interface PaymentDto {
  paymentId: string;
  orderId: string;
  amount: string;
  paymentMethod: PaymentMethodEnum;
  paymentStatus: PaymentStatusEnum;
  transactionId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class CreatePaymentDto {
  @IsUUID()
  orderId!: string;

  //checks if the string follows a specific pattern, The amount must be a number, optionally followed by a decimal point with 1 or 2 digits.
  @Matches(/^\d+(\.\d{1,2})?$/)
  //cuz float numbers can have precision issues
  amount!: string;

  @IsEnum(PaymentMethodEnum)
  paymentMethod!: PaymentMethodEnum;

  @IsOptional()
  @IsString()
  //payment provider gives us unique id we can use it to track the payment status
  transactionId?: string;
}