import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { CommunityMessageDto } from "./community.dto";

import { NotificationsGateway } from "../notifications/notifications.gateway";
import { SOCKET_EVENTS } from "@shared/events";

type Actor = { userId: string; role: string; tokenVersion?: number };
const STAFF = ["ADMIN", "MANAGER", "EMPLOYEE"];
const PERSON = `json_build_object('id',u.user_id,'name',concat_ws(' ',u.first_name,u.last_name),'avatar',u.avatar,'role',r.role_name)`;

@Injectable()
export class CommunityService {
  constructor(private readonly db: DataSource, private readonly realtime: NotificationsGateway) {}
  staff(actor: Actor) {
    if (!STAFF.includes(actor.role))
      throw new ForbiddenException("Staff access required");
  }
  adopter(actor: Actor) {
    if (actor.role !== "ADOPTER")
      throw new ForbiddenException("Friends and private chat are for adopters");
  }
  async access(actor: Actor) {
    const rows = await this.db.query(
      "SELECT user_id FROM community_blocks WHERE user_id=$1",
      [actor.userId],
    );
    return {
      blocked: rows.length > 0,
      message: rows.length ? "You are blocked from Community." : null,
    };
  }
  async allowed(actor: Actor) {
    if ((await this.access(actor)).blocked)
      throw new ForbiddenException("You are blocked from Community.");
  }
  async searchAdopters(actor: Actor, name: string) {
    this.adopter(actor);
    if (!name.trim()) return [];
    const rows = await this.db.query(
      `SELECT ${PERSON} AS person FROM users u JOIN roles r ON r.role_id=u.role_id
      WHERE r.role_name='ADOPTER' AND r.is_active=true AND u.status='active' AND u.user_id<>$1
      AND strpos(lower(concat_ws(' ',u.first_name,u.last_name)),lower($2))>0
      ORDER BY u.first_name,u.last_name,u.user_id LIMIT 30`,
      [actor.userId, name.trim()],
    );
    return rows.map((row: { person: Record<string, unknown> }) => row.person);
  }
  async profile(id: string) {
    const [person] = await this.db.query(
      `SELECT (${PERSON})::jsonb || jsonb_build_object('email',u.email) AS person FROM users u JOIN roles r ON r.role_id=u.role_id
      WHERE u.user_id=$1 AND r.role_name='ADOPTER' AND u.status='active' AND r.is_active=true`,
      [id],
    );
    if (!person) throw new NotFoundException("Public profile not available");
    return person.person;
  }
  async messages(actor: Actor, before?: string) {
    await this.allowed(actor);
    return this.db.query(
      `SELECT m.id,m.text,m.reply_to AS "replyTo",m.created_at AS "createdAt",
      m.deleted_at AS "deletedAt", ${PERSON} AS sender,
      CASE WHEN m.image IS NOT NULL AND m.deleted_at IS NULL THEN '/community/messages/' || m.id || '/image' END AS image,
      CASE WHEN p.id IS NOT NULL THEN json_build_object('id',p.id,'text',CASE WHEN p.deleted_at IS NOT NULL THEN 'This message has been deleted.' ELSE COALESCE(p.text,'Photo') END) END AS reply
      FROM community_messages m JOIN users u ON u.user_id=m.sender_id JOIN roles r ON r.role_id=u.role_id
      LEFT JOIN community_messages p ON p.id=m.reply_to
      WHERE ($1::uuid IS NULL OR (m.created_at,m.id)<(SELECT created_at,id FROM community_messages WHERE id=$1))
      ORDER BY m.created_at DESC,m.id DESC LIMIT 50`,
      [before ?? null],
    );
  }
  async send(
    actor: Actor,
    dto: CommunityMessageDto,
    file?: Express.Multer.File,
  ) {
    await this.allowed(actor);
    const text = dto.text?.trim() || null;
    if (!text && !file)
      throw new BadRequestException("Write a message or attach a photo");
    if (file) {
      const b = file.buffer;
      const valid =
        (file.mimetype === "image/png" &&
          b
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
        (file.mimetype === "image/jpeg" &&
          b[0] === 255 &&
          b[1] === 216 &&
          b[2] === 255) ||
        (file.mimetype === "image/webp" &&
          b.toString("ascii", 0, 4) === "RIFF" &&
          b.toString("ascii", 8, 12) === "WEBP");
      if (!valid)
        throw new BadRequestException("Upload a PNG, JPEG, or WebP image");
    }
    if (
      dto.replyTo &&
      !(
        await this.db.query("SELECT id FROM community_messages WHERE id=$1", [
          dto.replyTo,
        ])
      ).length
    )
      throw new NotFoundException("Reply message not found");
    const [message] = await this.db.query(
      `INSERT INTO community_messages(sender_id,text,image,image_type,reply_to)
      VALUES($1,$2,$3,$4,$5) RETURNING id`,
      [
        actor.userId,
        text,
        file?.buffer ?? null,
        file?.mimetype ?? null,
        dto.replyTo ?? null,
      ],
    );
    return message;
  }
  async image(actor: Actor, id: string) {
    await this.allowed(actor);
    const [row] = await this.db.query(
      "SELECT image,image_type FROM community_messages WHERE id=$1 AND deleted_at IS NULL AND image IS NOT NULL",
      [id],
    );
    if (!row) throw new NotFoundException("Photo not available");
    return row;
  }
  async deleteMessage(actor: Actor, id: string) {
    await this.allowed(actor);
    const [message] = await this.db.query(
      "SELECT sender_id FROM community_messages WHERE id=$1",
      [id],
    );
    if (!message) throw new NotFoundException("Message not found");
    if (message.sender_id !== actor.userId) this.staff(actor);
    await this.db.query(
      `UPDATE community_messages SET text=NULL,image=NULL,image_type=NULL,deleted_at=now(),deleted_by=$2 WHERE id=$1 AND deleted_at IS NULL`,
      [id, actor.userId],
    );
    return { deleted: true };
  }
  async blocks(actor: Actor) {
    this.staff(actor);
    return this.db.query(
      `SELECT ${PERSON} AS user,b.created_at AS "createdAt" FROM community_blocks b JOIN users u ON u.user_id=b.user_id JOIN roles r ON r.role_id=u.role_id ORDER BY b.created_at DESC`,
    );
  }
  async block(actor: Actor, id: string, remove = false) {
    this.staff(actor);
    if (remove)
      await this.db.query("DELETE FROM community_blocks WHERE user_id=$1", [
        id,
      ]);
    else {
      if (id === actor.userId)
        throw new BadRequestException("You cannot block yourself");
      if (
        !(
          await this.db.query("SELECT user_id FROM users WHERE user_id=$1", [
            id,
          ])
        ).length
      )
        throw new NotFoundException("User not found");
      await this.db.query(
        "INSERT INTO community_blocks(user_id,moderator_id) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING",
        [id, actor.userId],
      );
    }
    return { blocked: !remove };
  }
  async heartbeat(actor: Actor) {
    await this.db.transaction(async (manager) => {
      const [user] = await manager.query(
        "SELECT refresh_token_version,status FROM users WHERE user_id=$1 FOR UPDATE",
        [actor.userId],
      );
      if (
        !user ||
        user.status !== "active" ||
        user.refresh_token_version !== actor.tokenVersion
      ) {
        throw new ForbiddenException("Session is no longer active");
      }
      await manager.query(
        "INSERT INTO user_presence(user_id) VALUES($1) ON CONFLICT(user_id) DO UPDATE SET last_seen_at=now()",
        [actor.userId],
      );
    });
    return { ok: true };
  }
  async friends(actor: Actor) {
    this.adopter(actor);
    const rows = await this.db.query(
      `SELECT f.friendship_id AS id,${PERSON} AS friend,
      p.last_seen_at AS "lastSeenAt"
      FROM friendships f JOIN users u ON u.user_id=CASE WHEN f.user1_id=$1 THEN f.user2_id ELSE f.user1_id END
      JOIN roles r ON r.role_id=u.role_id LEFT JOIN user_presence p ON p.user_id=u.user_id
      WHERE (f.user1_id=$1 OR f.user2_id=$1) AND r.role_name='ADOPTER' AND u.status='active' AND r.is_active=true ORDER BY u.first_name`,
      [actor.userId],
    );
    return rows.map((row: { friend: { id: string } }) => ({ ...row, online: this.realtime.isOnline(row.friend.id) }));
  }
  async pairLock(manager: EntityManager, a: string, b: string) {
    await manager.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
      [[a, b].sort().join(":")],
    );
  }
  async request(actor: Actor, id: string) {
    this.adopter(actor);
    if (id === actor.userId)
      throw new BadRequestException("You cannot add yourself");
    await this.profile(id);
    return this.db.transaction(async (m) => {
      await this.pairLock(m, actor.userId, id);
      const pair = [actor.userId, id].sort();
      if (
        (
          await m.query(
            "SELECT friendship_id FROM friendships WHERE user1_id=$1 AND user2_id=$2",
            pair,
          )
        ).length
      )
        throw new ConflictException("You are already friends");
      if (
        (
          await m.query(
            `SELECT id FROM friend_requests WHERE LEAST(sender_id,recipient_id)=$1 AND GREATEST(sender_id,recipient_id)=$2 AND status='PENDING'`,
            pair,
          )
        ).length
      )
        throw new ConflictException("A friend request is already pending");
      const [request] = await m.query(
        "INSERT INTO friend_requests(sender_id,recipient_id) VALUES($1,$2) RETURNING id",
        [actor.userId, id],
      );
      return request;
    });
  }
  async requests(actor: Actor) {
    this.adopter(actor);
    return this.db.query(
      `SELECT f.id,f.sender_id AS "senderId",f.recipient_id AS "recipientId",${PERSON} AS user
      FROM friend_requests f JOIN users u ON u.user_id=CASE WHEN f.sender_id=$1 THEN f.recipient_id ELSE f.sender_id END
      JOIN roles r ON r.role_id=u.role_id WHERE (f.sender_id=$1 OR f.recipient_id=$1) AND f.status='PENDING' AND r.role_name='ADOPTER' AND u.status='active' ORDER BY f.created_at DESC`,
      [actor.userId],
    );
  }
  async respond(
    actor: Actor,
    id: string,
    action: "accept" | "reject" | "cancel",
  ) {
    this.adopter(actor);
    return this.db.transaction(async (m) => {
      const [initial] = await m.query(
        "SELECT * FROM friend_requests WHERE id=$1",
        [id],
      );
      if (!initial) throw new NotFoundException("Request not found");
      await this.pairLock(m, initial.sender_id, initial.recipient_id);
      const [request] = await m.query(
        "SELECT * FROM friend_requests WHERE id=$1 FOR UPDATE",
        [id],
      );
      if (
        (action === "cancel" ? request.sender_id : request.recipient_id) !==
        actor.userId
      )
        throw new ForbiddenException("This request is not yours");
      if (request.status !== "PENDING")
        throw new ConflictException("This request has already been handled");
      if (action === "accept") {
        await this.profile(request.sender_id);
        await m.query(
          `INSERT INTO friendships(user1_id,user2_id,created_by_user_id,is_system_generated) VALUES($1,$2,$3,false) ON CONFLICT(user1_id,user2_id) DO NOTHING`,
          [...[request.sender_id, request.recipient_id].sort(), actor.userId],
        );
      }
      await m.query("UPDATE friend_requests SET status=$2 WHERE id=$1", [
        id,
        { accept: "ACCEPTED", reject: "REJECTED", cancel: "CANCELLED" }[action],
      ]);
      return { ok: true };
    });
  }
  async removeFriend(actor: Actor, id: string) {
    this.adopter(actor);
    return this.db.transaction(async (m) => {
      await this.pairLock(m, actor.userId, id);
      await m.query(
        "DELETE FROM friendships WHERE user1_id=$1 AND user2_id=$2",
        [actor.userId, id].sort(),
      );
      return { ok: true };
    });
  }
  async startConversation(actor: Actor, id: string) {
    this.adopter(actor);
    await this.profile(id);
    return this.db.transaction(async (m) => {
      await this.pairLock(m, actor.userId, id);
      const pair = [actor.userId, id].sort();
      if (
        !(
          await m.query(
            "SELECT friendship_id FROM friendships WHERE user1_id=$1 AND user2_id=$2",
            pair,
          )
        ).length
      )
        throw new ForbiddenException(
          "Private chat requires an accepted friendship",
        );
      const [conversation] = await m.query(
        "INSERT INTO direct_conversations(user1_id,user2_id) VALUES($1,$2) ON CONFLICT(user1_id,user2_id) DO UPDATE SET user1_id=EXCLUDED.user1_id RETURNING id",
        pair,
      );
      return conversation;
    });
  }
  async conversations(actor: Actor) {
    this.adopter(actor);
    return this.db.query(
      `SELECT c.id,${PERSON} AS friend,
      EXISTS(SELECT 1 FROM friendships f WHERE f.user1_id=c.user1_id AND f.user2_id=c.user2_id) AS "canSend",
      (SELECT text FROM direct_messages WHERE conversation_id=c.id ORDER BY created_at DESC,id DESC LIMIT 1) AS "lastMessage"
      FROM direct_conversations c JOIN users u ON u.user_id=CASE WHEN c.user1_id=$1 THEN c.user2_id ELSE c.user1_id END JOIN roles r ON r.role_id=u.role_id
      WHERE (c.user1_id=$1 OR c.user2_id=$1) AND r.role_name='ADOPTER' ORDER BY (SELECT max(created_at) FROM direct_messages WHERE conversation_id=c.id) DESC NULLS LAST`,
      [actor.userId],
    );
  }
  async conversation(
    actor: Actor,
    id: string,
    manager: EntityManager = this.db.manager,
  ) {
    this.adopter(actor);
    const [c] = await manager.query(
      "SELECT * FROM direct_conversations WHERE id=$1 AND (user1_id=$2 OR user2_id=$2)",
      [id, actor.userId],
    );
    if (!c) throw new NotFoundException("Conversation not found");
    await this.profile(c.user1_id === actor.userId ? c.user2_id : c.user1_id);
    return c;
  }
  async directMessages(actor: Actor, id: string, before?: string) {
    await this.conversation(actor, id);
    return this.db.query(
      `SELECT id,sender_id AS "senderId",text,created_at AS "createdAt",read_at AS "readAt" FROM direct_messages
      WHERE conversation_id=$1 AND ($2::uuid IS NULL OR (created_at,id)<(SELECT created_at,id FROM direct_messages WHERE id=$2 AND conversation_id=$1))
      ORDER BY created_at DESC,id DESC LIMIT 50`,
      [id, before ?? null],
    );
  }
  async sendDirect(actor: Actor, id: string, text: string) {
    if (!text.trim()) throw new BadRequestException("Write a message");
    const result = await this.db.transaction(async (m) => {
      const c = await this.conversation(actor, id, m);
      await this.pairLock(m, c.user1_id, c.user2_id);
      if (
        !(
          await m.query(
            "SELECT friendship_id FROM friendships WHERE user1_id=$1 AND user2_id=$2",
            [c.user1_id, c.user2_id],
          )
        ).length
      )
        throw new ForbiddenException(
          "Private chat requires an accepted friendship",
        );
      const [message] = await m.query(
        "INSERT INTO direct_messages(conversation_id,sender_id,text) VALUES($1,$2,$3) RETURNING id,sender_id AS \"senderId\",text,created_at AS \"createdAt\",read_at AS \"readAt\"",
        [id, actor.userId, text.trim()],
      );
      return { message, userIds: [c.user1_id, c.user2_id] };
    });
    this.realtime.emitToUsers(result.userIds, SOCKET_EVENTS.DIRECT_MESSAGE, { conversationId: id, message: result.message });
    return result.message;
  }
  async read(actor: Actor, id: string) {
    const c = await this.conversation(actor, id);
    const rows = await this.db.query(
      "UPDATE direct_messages SET read_at=now() WHERE conversation_id=$1 AND sender_id<>$2 AND read_at IS NULL RETURNING id,read_at AS \"readAt\"",
      [id, actor.userId],
    );
    const updated = rows[0];
    if (updated.length) this.realtime.emitToUsers([c.user1_id, c.user2_id], SOCKET_EVENTS.DIRECT_MESSAGES_READ, {
      conversationId: id, messages: updated,
    });
    return { ok: true };
  }
}
