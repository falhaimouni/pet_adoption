import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from './product.entity';

@Unique(['cartId', 'productId'])
@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid', { name: 'cart_item_id' })
  cartItemId!: string;

  @Column({ name: 'cart_id', type: 'uuid' })
  cartId!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Cart, (cart) => cart.cartItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart!: Cart;

  @ManyToOne(() => Product, (product) => product.cartItems, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'integer', default: 1 })
  quantity!: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  unitPrice!: string;

  @Column({ name: 'subtotal', type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal!: string;
}
