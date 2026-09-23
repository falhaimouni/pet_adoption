const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { DataSource } = require("typeorm");
const {
  CommunityService,
} = require("../../dist/Backend/src/modules/community/community.service.js");
const {
  AddCommunityAndDirectChat1790200000000,
} = require("../../dist/Backend/src/database/migrations/1790200000000-AddCommunityAndDirectChat.js");

// A separate disposable database is mandatory: this suite creates a unique schema.
test(
  "Community and friend chat permissions, persistence, concurrency, and rollback",
  { skip: !process.env.TEST_DATABASE_URL },
  async (t) => {
    const schema = `community_test_${randomUUID().replaceAll("-", "")}`;
    const db = new DataSource({
      type: "postgres",
      url: process.env.TEST_DATABASE_URL,
      extra: { options: `-c search_path=${schema},public` },
    });
    await db.initialize();
    const migration = new AddCommunityAndDirectChat1790200000000();
    try {
      await db.query(`CREATE SCHEMA "${schema}"`);
      await db.query(`CREATE TABLE roles(role_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),role_name text UNIQUE,is_active boolean DEFAULT true);
      CREATE TABLE users(user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),role_id uuid REFERENCES roles,first_name text,last_name text,email text,avatar text,refresh_token_version integer DEFAULT 0,status text DEFAULT 'active');
      CREATE TABLE friendships(friendship_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user1_id uuid REFERENCES users,user2_id uuid REFERENCES users,created_by_user_id uuid REFERENCES users,is_system_generated boolean DEFAULT false,UNIQUE(user1_id,user2_id));`);
      await migration.up(db.createQueryRunner());
      const actors = {};
      for (const role of ["ADOPTER", "VET", "ADMIN", "MANAGER", "EMPLOYEE"]) {
        const [r] = await db.query(
          "INSERT INTO roles(role_name) VALUES($1) RETURNING role_id",
          [role],
        );
        for (let n = 0; n < (role === "ADOPTER" ? 3 : 1); n++) {
          const [u] = await db.query(
            "INSERT INTO users(role_id,first_name,last_name) VALUES($1,$2,$3) RETURNING user_id",
            [r.role_id, role, String(n)],
          );
          actors[`${role}${n}`] = { userId: u.user_id, role, tokenVersion: 0 };
        }
      }
      const a = actors.ADOPTER0,
        b = actors.ADOPTER1,
        c = actors.ADOPTER2,
        admin = actors.ADMIN0,
        vet = actors.VET0;
      const service = new CommunityService(db);
      let request, conversation, message;
      await t.test("adopter search excludes self and staff and restricts callers", async () => {
        const rows=await service.searchAdopters(a,"ADOPTER");
        assert.equal(rows.length,2);
        assert.ok(rows.every(person=>person.id!==a.userId && person.role==='ADOPTER'));
        assert.deepEqual(await service.searchAdopters(a,"ADMIN"),[]);
        assert.deepEqual(await service.searchAdopters(a,"%"),[]);
        await assert.rejects(service.searchAdopters(admin,"ADOPTER"),/for adopters/);
      });
      await t.test(
        "staff profiles are unavailable; public profiles expose only approved fields",
        async () => {
          const p = await service.profile(b.userId);
          assert.deepEqual(Object.keys(p).sort(), [
            "avatar",
            "email",
            "id",
            "name",
            "role",
          ]);
          await assert.rejects(service.profile(admin.userId), /not available/);
          await assert.rejects(service.profile(vet.userId), /not available/);
        },
      );
      await t.test(
        "non-friends cannot start private conversations and staff cannot use friend APIs",
        async () => {
          await assert.rejects(
            service.startConversation(a, b.userId),
            /accepted friendship/,
          );
          await assert.rejects(
            service.request(a, admin.userId),
            /not available/,
          );
          await assert.rejects(service.request(vet, a.userId), /for adopters/);
          await assert.rejects(service.request(a, a.userId), /yourself/);
        },
      );
      await t.test(
        "opposite simultaneous friend requests create only one pending request",
        async () => {
          const outcomes = await Promise.allSettled([
            service.request(a, b.userId),
            service.request(b, a.userId),
          ]);
          assert.equal(
            outcomes.filter((x) => x.status === "fulfilled").length,
            1,
          );
          [request] = await db.query(
            "SELECT * FROM friend_requests WHERE status='PENDING'",
          );
          await assert.rejects(
            service.respond(c, request.id, "accept"),
            /not yours/,
          );
          const receiver = request.recipient_id === a.userId ? a : b;
          await service.respond(receiver, request.id, "accept");
          assert.equal((await service.friends(a)).length, 1);
          await assert.rejects(
            service.respond(receiver, request.id, "accept"),
            /already been handled/,
          );
        },
      );
      await t.test(
        "private conversations are unique and visible only to their participants",
        async () => {
          const results = await Promise.all([
            service.startConversation(a, b.userId),
            service.startConversation(b, a.userId),
          ]);
          assert.equal(results[0].id, results[1].id);
          conversation = results[0];
          await service.sendDirect(a, conversation.id, "Private hello");
          await assert.rejects(
            service.directMessages(c, conversation.id),
            /not found/,
          );
          await assert.rejects(
            service.directMessages(admin, conversation.id),
            /for adopters/,
          );
          await service.read(b, conversation.id);
          assert.ok(
            (await service.directMessages(a, conversation.id))[0].readAt,
          );
        },
      );
      await t.test(
        "Community text, photo, reply, and vet badge data persist",
        async () => {
          message = await service.send(
            a,
            { text: "Photo question" },
            {
              buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
              mimetype: "image/png",
            },
          );
          await service.send(vet, { text: "Vet answer", replyTo: message.id });
          const rows = await service.messages(b);
          assert.equal(rows[0].sender.role, "VET");
          assert.equal(rows[0].reply.text, "Photo question");
          assert.equal(
            (await service.image(b, message.id)).image_type,
            "image/png",
          );
          await assert.rejects(
            service.send(
              a,
              {},
              { buffer: Buffer.from("<svg/>"), mimetype: "image/png" },
            ),
            /PNG/,
          );
          await assert.rejects(service.send(a, {}), /Write a message/);
          await assert.rejects(
            service.deleteMessage(b, message.id),
            /Staff access/,
          );
        },
      );
      await t.test(
        "staff deletion removes content and photos, including quoted replies",
        async () => {
          await service.deleteMessage(admin, message.id);
          const rows = await service.messages(b);
          const deleted = rows.find((m) => m.id === message.id);
          assert.ok(deleted.deletedAt);
          assert.equal(deleted.text, null);
          assert.equal(deleted.image, null);
          assert.equal(
            rows.find((m) => m.reply).reply.text,
            "This message has been deleted.",
          );
          await assert.rejects(service.image(b, message.id), /not available/);
        },
      );
      await t.test(
        "Community block denies all Community reads/writes but leaves friends and private chat usable",
        async () => {
          await assert.rejects(service.block(vet, a.userId), /Staff access/);
          await service.block(admin, a.userId);
          assert.equal((await service.access(a)).blocked, true);
          await assert.rejects(service.messages(a), /blocked from Community/);
          await assert.rejects(
            service.send(a, { text: "Blocked" }),
            /blocked from Community/,
          );
          assert.equal((await service.friends(a)).length, 1);
          await service.sendDirect(a, conversation.id, "Still private");
          await service.block(admin, a.userId, true);
          assert.equal((await service.access(a)).blocked, false);
          const own = await service.send(a, { text: "Own deletion" });
          await service.deleteMessage(a, own.id);
        },
      );
      await t.test(
        "heartbeat reports online and expires to offline",
        async () => {
          await service.heartbeat(b);
          assert.equal((await service.friends(a))[0].online, true);
          await db.query(
            "UPDATE user_presence SET last_seen_at=now()-interval '60 seconds'",
          );
          assert.equal((await service.friends(a))[0].online, false);
        },
      );
      await t.test("logout clears presence and stale in-flight heartbeats cannot restore it", async () => {
        const { AuthService } = require('../../dist/Backend/src/modules/auth/auth.service.js');
        const auth = new AuthService({findOne:async()=>({userId:b.userId})},{},{},{create:value=>value,save:async()=>{}}, {
          transaction: fn => db.transaction(manager=>fn({query:manager.query.bind(manager),getRepository:()=>({increment:async({userId})=>manager.query('UPDATE users SET refresh_token_version=refresh_token_version+1 WHERE user_id=$1',[userId])})}))
        },{},{},{});
        await Promise.allSettled([service.heartbeat(b),auth.logout(b.userId)]);
        assert.equal((await service.friends(a))[0].online,false);
        await assert.rejects(service.heartbeat(b),/Session is no longer active/);
        assert.equal((await service.friends(a))[0].online,false);
      });
      await t.test(
        "unfriending disables new private messages while preserving history",
        async () => {
          await service.removeFriend(a, b.userId);
          await assert.rejects(
            service.sendDirect(a, conversation.id, "Not allowed"),
            /accepted friendship/,
          );
          assert.equal(
            (await service.directMessages(a, conversation.id)).length,
            2,
          );
          assert.equal((await service.conversations(a))[0].canSend, false);
          assert.equal((await service.friends(a)).length, 0);
        },
      );
      await t.test(
        "requests can be rejected or cancelled by the proper participant",
        async () => {
          const r = await service.request(a, c.userId);
          await assert.rejects(service.respond(c, r.id, "cancel"), /not yours/);
          await service.respond(c, r.id, "reject");
          const next = await service.request(a, c.userId);
          await service.respond(a, next.id, "cancel");
          assert.equal((await service.requests(a)).length, 0);
        },
      );
      await t.test(
        "pagination retains ordering without duplicate rows",
        async () => {
          for (let n = 0; n < 53; n++)
            await service.send(b, { text: `Message ${n}` });
          const first = await service.messages(a);
          const second = await service.messages(a, first.at(-1).id);
          assert.equal(first.length, 50);
          assert.ok(second.length > 0);
          assert.equal(
            new Set([...first, ...second].map((m) => m.id)).size,
            first.length + second.length,
          );
        },
      );
      await t.test(
        "migration can be reverted without deleting users or legacy friendships",
        async () => {
          await migration.down(db.createQueryRunner());
          assert.equal((await db.query("SELECT * FROM users")).length, 7);
          assert.equal((await db.query("SELECT * FROM friendships")).length, 0);
        },
      );
    } finally {
      await db.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await db.destroy();
    }
  },
);
