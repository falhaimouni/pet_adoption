import { PaymentMethodEnum } from '../enums/payment-method.enum';
import { PaymentStatusEnum } from '../enums/payment-status.enum';

export interface PaymentDto {
  paymentId: string;
  orderId: string;
  amount: string;
  paymentMethod: PaymentMethodEnum;
  paymentStatus: PaymentStatusEnum;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}
