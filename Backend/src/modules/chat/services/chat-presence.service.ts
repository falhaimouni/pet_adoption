import { ForbiddenException, Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

// Presence is ephemeral: restarting the single backend releases all reply locks.
@Injectable()
export class ChatPresenceService {
  private readonly viewers = new Map<string, Map<string, Set<string>>>();
  private readonly owners = new Map<string, string>();
  private readonly queues = new Map<string, Promise<unknown>>();
  readonly changes = new EventEmitter();

  owner(conversationId: string): string | null {
    return this.owners.get(conversationId) ?? null;
  }

  join(conversationId: string, userId: string, socketId: string): void {
    const users = this.viewers.get(conversationId) ?? new Map<string, Set<string>>();
    const sockets = users.get(userId) ?? new Set<string>();
    sockets.add(socketId);
    users.set(userId, sockets);
    this.viewers.set(conversationId, users);
  }

  leave(conversationId: string, userId: string, socketId: string): void {
    const users = this.viewers.get(conversationId);
    const sockets = users?.get(userId);
    sockets?.delete(socketId);
    if (!sockets?.size) {
      users?.delete(userId);
      if (this.owner(conversationId) === userId) this.setOwner(conversationId, null);
    }
    if (!users?.size) this.viewers.delete(conversationId);
  }

  disconnect(socketId: string): void {
    for (const [conversationId, users] of this.viewers) {
      for (const userId of users.keys()) this.leave(conversationId, userId, socketId);
    }
  }

  async reply<T>(conversationId: string, userId: string, send: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(conversationId) ?? Promise.resolve();
    const pending = previous.catch(() => undefined).then(async () => {
      if (!this.viewers.get(conversationId)?.get(userId)?.size) {
        throw new ForbiddenException('Open the conversation and connect before replying');
      }
      const owner = this.owner(conversationId);
      if (owner && owner !== userId) {
        throw new ForbiddenException('Another employee is handling this conversation');
      }
      if (!owner) this.setOwner(conversationId, userId);
      try {
        return await send();
      } catch (error) {
        if (!owner && this.owner(conversationId) === userId) this.setOwner(conversationId, null);
        throw error;
      }
    });
    this.queues.set(conversationId, pending);
    try {
      return await pending;
    } finally {
      if (this.queues.get(conversationId) === pending) this.queues.delete(conversationId);
    }
  }

  private setOwner(conversationId: string, employeeId: string | null): void {
    if (employeeId) this.owners.set(conversationId, employeeId);
    else this.owners.delete(conversationId);
    this.changes.emit('change', { conversationId, assignedEmployeeId: employeeId });
  }
}
