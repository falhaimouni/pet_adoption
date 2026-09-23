import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
  Check,
  Index,
} from "typeorm";
import { User } from "./user.entity";

@Entity("community_messages")
@Index("community_messages_timeline", ["createdAt", "id"])
export class CommunityMessage {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "sender_id", type: "uuid" }) senderId!: string;
  @ManyToOne(() => User) @JoinColumn({ name: "sender_id" }) sender!: User;
  @Column({ type: "varchar", length: 4000, nullable: true }) text!:
    string | null;
  @Column({ type: "bytea", nullable: true, select: false })
  image!: Buffer | null;
  @Column({ name: "image_type", type: "varchar", length: 30, nullable: true })
  imageType!: string | null;
  @Column({ name: "reply_to", type: "uuid", nullable: true }) replyTo!:
    string | null;
  @ManyToOne(() => CommunityMessage, { onDelete: "SET NULL" })
  @JoinColumn({ name: "reply_to" })
  parent?: CommunityMessage;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
  @Column({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt!: Date | null;
  @Column({ name: "deleted_by", type: "uuid", nullable: true }) deletedBy!:
    string | null;
  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "deleted_by" })
  moderator?: User;
}
@Entity("community_blocks")
export class CommunityBlock {
  @PrimaryColumn({ name: "user_id", type: "uuid" }) userId!: string;
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
  @Column({ name: "moderator_id", type: "uuid", nullable: true }) moderatorId!:
    string | null;
  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "moderator_id" })
  moderator?: User;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
@Entity("friend_requests")
@Check("sender_id <> recipient_id")
@Check("status IN ('PENDING','ACCEPTED','REJECTED','CANCELLED')")
// The unordered pending-pair expression index is managed by the migration.
@Index("friend_requests_pending_pair", { synchronize: false })
export class FriendRequest {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "sender_id", type: "uuid" }) senderId!: string;
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sender_id" })
  sender!: User;
  @Column({ name: "recipient_id", type: "uuid" }) recipientId!: string;
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "recipient_id" })
  recipient!: User;
  @Column({ type: "varchar", length: 12, default: "PENDING" }) status!:
    "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
@Entity("direct_conversations")
@Unique(["user1Id", "user2Id"])
@Check("user1_id::text < user2_id::text")
export class DirectConversation {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "user1_id", type: "uuid" }) user1Id!: string;
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user1_id" })
  user1!: User;
  @Column({ name: "user2_id", type: "uuid" }) user2Id!: string;
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user2_id" })
  user2!: User;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
@Entity("direct_messages")
@Index("direct_messages_timeline", ["conversationId", "createdAt", "id"])
export class DirectMessage {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "conversation_id", type: "uuid" }) conversationId!: string;
  @ManyToOne(() => DirectConversation, { onDelete: "CASCADE" })
  @JoinColumn({ name: "conversation_id" })
  conversation!: DirectConversation;
  @Column({ name: "sender_id", type: "uuid" }) senderId!: string;
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sender_id" })
  sender!: User;
  @Column({ type: "varchar", length: 4000 }) text!: string;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
  @Column({ name: "read_at", type: "timestamptz", nullable: true })
  readAt!: Date | null;
}
@Entity("user_presence")
export class UserPresence {
  @PrimaryColumn({ name: "user_id", type: "uuid" }) userId!: string;
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
  @Column({ name: "last_seen_at", type: "timestamptz", default: () => "now()" })
  lastSeenAt!: Date;
}
