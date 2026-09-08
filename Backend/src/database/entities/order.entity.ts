import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';
import { User } from './user.entity';
import { OrderStatusEnum } from '@shared/enums/order-status.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid', { name: 'order_id' })
  orderId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'recipient_name', type: 'varchar', length: 160 })
  recipientName!: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 30 })
  phoneNumber!: string;

  @Column({ name: 'address_line', type: 'varchar', length: 255 })
  addressLine!: string;

  @Column({ type: 'varchar', length: 120 })
  city!: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postalCode!: string | null;

  @Column({ name: 'delivery_notes', type: 'text', nullable: true })
  deliveryNotes!: string | null;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPrice!: string;

  @Column({
    name: 'order_status',
    type: 'enum',
    enum: OrderStatusEnum,
    default: OrderStatusEnum.PENDING,
  })
  orderStatus!: OrderStatusEnum;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  orderItems!: OrderItem[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payments!: Payment[];
}
