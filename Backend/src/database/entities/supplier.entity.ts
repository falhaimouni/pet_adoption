import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Supply } from './supply.entity';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid', { name: 'supplier_id' })
  supplierId!: string;

  @Column({ name: 'supplier_name', type: 'varchar', length: 160 })
  supplierName!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string | null;

  @Column({ type: 'text', nullable: true })
  address?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => Supply, (supply) => supply.supplier)
  supplies!: Supply[];
}
