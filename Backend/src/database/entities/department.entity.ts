import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Employee } from './employee.entity';
import { User } from './user.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid', { name: 'department_id' })
  departmentId!: string;

  @Column({ name: 'department_name', type: 'varchar', length: 120 })
  departmentName!: string;

  @Column({ name: 'manager_id', type: 'uuid', nullable: true })
  managerId?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.managedDepartments, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'manager_id' })
  manager?: User | null;

  @OneToMany(() => Employee, (employee) => employee.department)
  employees!: Employee[];
}
