import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ActivityLog } from './activity-log.entity';
import { AdoptionRequest } from './adoption-request.entity';
import { Adopter } from './adopter.entity';
import { Cart } from './cart.entity';
import { Conversation } from './conversation.entity';
import { Department } from './department.entity';
import { Employee } from './employee.entity';
import { FileUpload } from './file-upload.entity';
import { MedicalEntry } from './medical-entry.entity';
import { Message } from './message.entity';
import { Notification } from './notification.entity';
import { OAuthAccount } from './oauth-account.entity';
import { Order } from './order.entity';
import { PasswordResetToken } from './password-reset-token.entity';
import { Pet } from './pet.entity';
import { Role } from './role.entity';
import { Vaccination } from './vaccination.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  userId!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 80 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 80 })
  lastName!: string;

  @Index()
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password?: string | null;

  @Column({ type: 'text', nullable: true })
  avatar?: string | null;

  @Column({
    type: 'enum',
    enum: ['LOCAL', 'GOOGLE'],
    default: 'LOCAL',
  })
  provider!: 'LOCAL' | 'GOOGLE';

  @Column({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', length: 40, default: 'active' })
  status!: string;

  @Column({ name: 'refresh_token_version', type: 'integer', default: 0 })
  refreshTokenVersion!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => Role, (role) => role.users, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @OneToMany(() => Department, (department) => department.manager)
  managedDepartments!: Department[];

  @OneToOne(() => Employee, (employee) => employee.user)
  employeeProfile?: Employee;

  @OneToMany(() => Pet, (pet) => pet.createdByUser)
  createdPets!: Pet[];

  @OneToMany(() => MedicalEntry, (entry) => entry.veterinarian)
  medicalEntries!: MedicalEntry[];

  @OneToMany(() => Vaccination, (vaccination) => vaccination.veterinarian)
  vaccinations!: Vaccination[];

  @OneToOne(() => Adopter, (adopter) => adopter.user)
  adopterProfile?: Adopter;

  @OneToMany(() => AdoptionRequest, (request) => request.reviewer)
  reviewedAdoptionRequests!: AdoptionRequest[];

  @OneToMany(() => Conversation, (conversation) => conversation.assignedEmployee)
  assignedConversations!: Conversation[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages!: Message[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications!: Notification[];

  @OneToMany(() => ActivityLog, (log) => log.user)
  activityLogs!: ActivityLog[];

  @OneToOne(() => Cart, (cart) => cart.user)
  cart?: Cart;

  @OneToMany(() => Order, (order) => order.user)
  orders!: Order[];

  @OneToMany(() => PasswordResetToken, (token) => token.user)
  passwordResetTokens!: PasswordResetToken[];

  @OneToMany(() => OAuthAccount, (account) => account.user)
  oauthAccounts!: OAuthAccount[];

  @OneToMany(() => FileUpload, (file) => file.uploadedByUser)
  uploadedFiles!: FileUpload[];
}
