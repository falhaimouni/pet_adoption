//Store the Google provider identity associated with a Google-only user account.
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user.entity';

@Entity('oauth_accounts')
@Unique(['provider', 'providerUserId'])
export class OAuthAccount {
  @PrimaryGeneratedColumn('uuid', { name: 'oauth_id' })
  oauthId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 80 })
  provider!: string;

  @Column({ name: 'provider_user_id', type: 'varchar', length: 255 })
  providerUserId!: string;

  @ManyToOne(() => User, (user) => user.oauthAccounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
