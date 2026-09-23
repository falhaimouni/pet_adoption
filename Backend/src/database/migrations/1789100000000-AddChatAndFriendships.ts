import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatAndFriendships1789100000000
  implements MigrationInterface
{
  name = 'AddChatAndFriendships1789100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "conversations_status_enum" AS ENUM ('OPEN', 'ASSIGNED', 'CLOSED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(`
      ALTER TABLE "conversations"
      ALTER COLUMN "status" TYPE "conversations_status_enum"
      USING (
        CASE UPPER("status"::text)
          WHEN 'OPEN' THEN 'OPEN'
          WHEN 'ASSIGNED' THEN 'ASSIGNED'
          WHEN 'IN_PROGRESS' THEN 'ASSIGNED'
          WHEN 'CLOSED' THEN 'CLOSED'
          ELSE 'OPEN'
        END
      )::"conversations_status_enum"
    `);
    await queryRunner.query(
      `ALTER TABLE "conversations" ALTER COLUMN "status" SET DEFAULT 'OPEN'`,
    );

    await queryRunner.query(`
      WITH ranked AS (
        SELECT "conversation_id",
          ROW_NUMBER() OVER (
            PARTITION BY "adopter_id"
            ORDER BY "updated_at" DESC, "created_at" DESC
          ) AS position
        FROM "conversations"
        WHERE "status" IN ('OPEN', 'ASSIGNED')
      )
      UPDATE "conversations" AS conversation
      SET "status" = 'CLOSED'
      FROM ranked
      WHERE conversation."conversation_id" = ranked."conversation_id"
        AND ranked.position > 1
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_conversations_active_adopter"
      ON "conversations" ("adopter_id")
      WHERE "status" IN ('OPEN', 'ASSIGNED')
    `);

    await queryRunner.query(
      `CREATE TYPE "messages_type_enum" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'SYSTEM')`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "message_text" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD "file_url" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD "type" "messages_type_enum" NOT NULL DEFAULT 'TEXT'`,
    );
    await queryRunner.query(`
      CREATE INDEX "IDX_messages_conversation_created_at"
      ON "messages" ("conversation_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE TABLE "friendships" (
        "friendship_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user1_id" uuid NOT NULL,
        "user2_id" uuid NOT NULL,
        "created_by_user_id" uuid,
        "is_system_generated" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_friendships" PRIMARY KEY ("friendship_id"),
        CONSTRAINT "UQ_friendships_user_pair" UNIQUE ("user1_id", "user2_id"),
        CONSTRAINT "CHK_friendships_distinct_users" CHECK ("user1_id" <> "user2_id"),
        CONSTRAINT "CHK_friendships_canonical_pair" CHECK ("user1_id"::text < "user2_id"::text),
        CONSTRAINT "FK_friendships_user1" FOREIGN KEY ("user1_id") REFERENCES "users"("user_id") ON DELETE CASCADE,
        CONSTRAINT "FK_friendships_user2" FOREIGN KEY ("user2_id") REFERENCES "users"("user_id") ON DELETE CASCADE,
        CONSTRAINT "FK_friendships_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "friendships"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_messages_conversation_created_at"`,
    );
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "type"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "file_url"`);
    await queryRunner.query(
      `UPDATE "messages" SET "message_text" = '' WHERE "message_text" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "message_text" SET NOT NULL`,
    );
    await queryRunner.query(`DROP TYPE "messages_type_enum"`);

    await queryRunner.query(
      `DROP INDEX "public"."UQ_conversations_active_adopter"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(`
      ALTER TABLE "conversations"
      ALTER COLUMN "status" TYPE varchar(40)
      USING LOWER("status"::text)
    `);
    await queryRunner.query(
      `UPDATE "conversations" SET "status" = 'in_progress' WHERE "status" = 'assigned'`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ALTER COLUMN "status" SET DEFAULT 'open'`,
    );
    await queryRunner.query(`DROP TYPE "conversations_status_enum"`);
  }
}
