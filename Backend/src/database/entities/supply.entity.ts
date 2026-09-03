import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Supplier } from './supplier.entity';
import { SupplyStatusEnum } from '@shared/enums/supply-status.enum';
import { Product } from './product.entity';

@Entity('supplies')
@Index('UQ_supplies_active_name_supplier', ['supplyName', 'supplierId'], {
  unique: true,
  where: '"is_active" = true',
})
export class Supply {
  @PrimaryGeneratedColumn('uuid', { name: 'supply_id' })
  supplyId!: string;

  @Column({ name: 'supply_name', type: 'varchar', length: 160 })
  supplyName!: string;

  @Column({ type: 'varchar', length: 100 })
  category!: string;

  @Column({ type: 'integer', default: 0 })
  quantity!: number;

  @Column({ name: 'selling_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  sellingPrice!: string;

  @Column({ name: 'purchase_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  purchasePrice!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'delivery_time_days', type: 'integer', nullable: true })
  deliveryTimeDays?: number | null;

  @Column({ name: 'minimum_order_quantity', type: 'integer', default: 1 })
  minimumOrderQuantity!: number;

  @Column({ name: 'low_stock_limit', type: 'integer', default: 0 })
  lowStockLimit!: number;

  @UpdateDateColumn({ name: 'last_updated', type: 'timestamp' })
  lastUpdated!: Date;

  @Column({name: 'supplier_id', type: 'uuid'})
  supplierId!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({type: 'enum', enum: SupplyStatusEnum, default: SupplyStatusEnum.AVAILABLE})
  status!: SupplyStatusEnum;

  @ManyToOne( ()=> Supplier, (supplier) => supplier.supplies, {onDelete: 'RESTRICT'})

  @JoinColumn({name: 'supplier_id'})
  supplier!: Supplier;

  @ManyToOne(() => Product, (product) => product.supplies, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}
