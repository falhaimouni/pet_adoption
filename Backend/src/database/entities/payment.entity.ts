import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { PaymentMethodEnum } from '@shared/enums/payment-method.enum';
import { PaymentStatusEnum } from '@shared/enums/payment-status.enum';

@Entity('payments')
@Unique('UQ_payments_order_id', ['orderId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid', { name: 'payment_id' })
  paymentId!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => Order, (order) => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: string;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethodEnum,
  })
  paymentMethod!: PaymentMethodEnum;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatusEnum,
  })
  paymentStatus!: PaymentStatusEnum;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
