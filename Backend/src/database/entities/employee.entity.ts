import { Column, Entity, JoinColumn, OneToOne, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Department } from './department.entity';
import { User } from './user.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid', { name: 'employee_id' })
  employeeId!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @Column({ name: 'department_id', type: 'uuid' })
  departmentId!: string;

  @Column({ type: 'varchar', length: 40, default: 'active' })
  status!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salary?: string | null;

  @Column({ name: 'hire_date', type: 'date', nullable: true })
  hireDate?: string | null;

  @Column({ type: 'text', nullable: true })
  address?: string | null;

  @OneToOne(() => User, (user) => user.employeeProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Department, (department) => department.employees, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'department_id' })
  department!: Department;
}
