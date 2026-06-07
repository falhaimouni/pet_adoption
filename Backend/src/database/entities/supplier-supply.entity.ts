import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Supplier } from './supplier.entity';
import { Supply } from './supply.entity';

@Entity('supplier_supplies')
@Unique(['supplierId', 'supplyId'])
export class SupplierSupply {
  @PrimaryGeneratedColumn('uuid', { name: 'supplier_supply_id' })
  supplierSupplyId!: string;

  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId!: string;

  @Column({ name: 'supply_id', type: 'uuid' })
  supplyId!: string;

  @Column({ name: 'supply_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  supplyPrice?: string | null;

  @Column({ name: 'delivery_time', type: 'varchar', length: 80, nullable: true })
  deliveryTime?: string | null;

  @Column({ name: 'minimum_order_quantity', type: 'integer', default: 1 })
  minimumOrderQuantity!: number;

  @ManyToOne(() => Supplier, (supplier) => supplier.supplierSupplies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @ManyToOne(() => Supply, (supply) => supply.supplierSupplies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supply_id' })
  supply!: Supply;
}
