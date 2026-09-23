import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommunityAndDirectChat1790200000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE community_blocks (
        user_id uuid PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
        moderator_id uuid REFERENCES users(user_id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE community_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id uuid NOT NULL REFERENCES users(user_id),
        text varchar(4000), image bytea, image_type varchar(30),
        reply_to uuid REFERENCES community_messages(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz, deleted_by uuid REFERENCES users(user_id) ON DELETE SET NULL
      );
      CREATE INDEX community_messages_timeline ON community_messages(created_at DESC, id DESC);
      CREATE TABLE friend_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        recipient_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        status varchar(12) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','ACCEPTED','REJECTED','CANCELLED')),
        created_at timestamptz NOT NULL DEFAULT now(),
        CHECK(sender_id <> recipient_id)
      );
      CREATE UNIQUE INDEX friend_requests_pending_pair ON friend_requests
        (LEAST(sender_id,recipient_id), GREATEST(sender_id,recipient_id)) WHERE status = 'PENDING';
      CREATE TABLE direct_conversations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user1_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        user2_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(user1_id,user2_id), CHECK(user1_id::text < user2_id::text)
      );
      CREATE TABLE direct_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id uuid NOT NULL REFERENCES direct_conversations(id) ON DELETE CASCADE,
        sender_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        text varchar(4000) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), read_at timestamptz
      );
      CREATE INDEX direct_messages_timeline ON direct_messages(conversation_id,created_at DESC,id DESC);
      CREATE TABLE user_presence (
        user_id uuid PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
        last_seen_at timestamptz NOT NULL DEFAULT now()
      );
    `);
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(
      `DROP TABLE user_presence, direct_messages, direct_conversations, friend_requests, community_messages, community_blocks`,
    );
  }
}
