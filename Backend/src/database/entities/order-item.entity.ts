import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Order } from './order.entity';
import { Product } from './product.entity';

@Unique(['orderId', 'productId'])
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid', { name: 'order_item_id' })
  orderItemId!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Order, (order) => order.orderItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => Product, (product) => product.orderItems, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'integer', default: 1 })
  quantity!: number;

  imageUrl?: string | null;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  unitPrice!: string;

  @Column({ name: 'subtotal', type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal!: string;
}
