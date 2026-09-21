import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CartItem } from './cart-item.entity';
import { OrderItem } from './order-item.entity';
import { Supply } from './supply.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid', { name: 'product_id' })
  productId!: string;

  @Column({ name: 'product_name', type: 'varchar', length: 160 })
  productName!: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  unitPrice!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cartItems!: CartItem[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems!: OrderItem[];

  @OneToMany(() => Supply, (supply) => supply.product)
  supplies!: Supply[];
}
