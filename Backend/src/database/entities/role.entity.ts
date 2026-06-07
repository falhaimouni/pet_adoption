import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid', { name: 'role_id' })
  roleId!: string;

  @Column({ name: 'role_name', type: 'varchar', length: 80, unique: true })
  roleName!: string;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];
}
