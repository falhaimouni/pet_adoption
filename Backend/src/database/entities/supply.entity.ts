import { Column, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SupplierSupply } from './supplier-supply.entity';

@Entity('supplies')
export class Supply {
  @PrimaryGeneratedColumn('uuid', { name: 'supply_id' })
  supplyId!: string;

  @Column({ name: 'supply_name', type: 'varchar', length: 160 })
  supplyName!: string;

  @Column({ type: 'varchar', length: 100 })
  category!: string;

  @Column({ type: 'integer', default: 0 })
  quantity!: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  unitPrice!: string;

  @Column({ name: 'low_stock_limit', type: 'integer', default: 0 })
  lowStockLimit!: number;

  @UpdateDateColumn({ name: 'last_updated', type: 'timestamp' })
  lastUpdated!: Date;

  @OneToMany(() => SupplierSupply, (supplierSupply) => supplierSupply.supply)
  supplierSupplies!: SupplierSupply[];
}
