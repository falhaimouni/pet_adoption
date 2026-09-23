const { ChatPresenceService } = require('../../dist/Backend/src/modules/chat/services/chat-presence.service.js');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MessageService } = require('../../dist/Backend/src/modules/chat/services/message.service.js');
const { ConversationService } = require('../../dist/Backend/src/modules/chat/services/conversation.service.js');
const { NotificationsService } = require('../../dist/Backend/src/modules/notifications/notifications.service.js');

function setup(status = 'ASSIGNED') {
  const conversation = { conversationId: 'chat', status, assignedEmployeeId: 'employee-one', adopter: { userId: 'adopter' } };
  const messages = [];
  const notifications = [];
  const conditions = [];
  const query = { update() { return this; }, set() { return this; }, where() { return this; }, andWhere(...args) { conditions.push(args); return this; }, async execute() {} };
  const messageRepo = { create: value => value, save: async value => { const saved = { ...value, createdAt: new Date() }; messages.push(saved); return saved; }, createQueryBuilder: () => query };
  const conversationRepo = { findOne: async () => conversation, update: async () => {} };
  const manager = { getRepository: entity => entity.name === 'Conversation' ? conversationRepo : entity.name === 'User' ? { findOne: async () => null } : messageRepo };
  const presence = new ChatPresenceService();
  presence.join('chat', 'employee-one', 'socket-one');
  presence.join('chat', 'employee-two', 'socket-two');
  const service = new MessageService(messageRepo, conversationRepo, { createChatMessage: async (...args) => notifications.push(args) }, { transaction: fn => fn(manager) }, presence);
  return { service, conversation, messages, notifications, conditions, presence };
}

test('first reply claims chat; another employee replies only after owner leaves', async () => {
  const f = setup();
  assert.equal(f.presence.owner('chat'), null);
  await f.service.sendMessage('chat', 'employee-one', 'EMPLOYEE', { type: 'TEXT', messageText: 'Hello' });
  await assert.rejects(f.service.sendMessage('chat', 'employee-two', 'EMPLOYEE', { type: 'TEXT', messageText: 'Blocked' }));
  f.presence.leave('chat', 'employee-one', 'socket-one');
  await f.service.sendMessage('chat', 'employee-two', 'EMPLOYEE', { type: 'TEXT', messageText: 'Hello' });
  assert.deepEqual(f.messages.map(m => m.senderId), ['employee-one', 'employee-two']);
});

test('legacy closed conversation accepts adopter and employee replies', async () => {
  const f = setup('CLOSED');
  await f.service.sendMessage('chat', 'adopter', 'ADOPTER', { type: 'TEXT', messageText: 'Hello again' });
  await f.service.sendMessage('chat', 'employee-two', 'EMPLOYEE', { type: 'TEXT', messageText: 'Welcome' });
  assert.equal(f.messages.length, 2);
  assert.deepEqual(f.notifications, [['adopter', 'adopter', true], ['employee-two', 'adopter', false]]);
});

test('unrelated adopters and vets cannot send', async () => {
  const f = setup();
  for (const [id, role] of [['other-adopter', 'ADOPTER'], ['vet', 'VET']]) {
    await assert.rejects(f.service.sendMessage('chat', id, role, { type: 'TEXT', messageText: 'No' }));
  }
  assert.equal(f.messages.length, 0);
});

test('staff reading does not mark support replies read for the adopter', async () => {
  const f = setup();
  await f.service.markMessagesAsRead('chat', 'employee-two', 'EMPLOYEE');
  assert.deepEqual(f.conditions.at(-1), ['sender_id = :adopterUserId', { adopterUserId: 'adopter' }]);
});

test('opening does not save or assign; closure is rejected', async () => {
  const conversation = { status: 'ASSIGNED', assignedEmployeeId: 'employee-one', adopter: { userId: 'adopter' }, messages: [] };
  const service = new ConversationService({ findOne: async () => structuredClone(conversation) }, {});
  const result = await service.getConversation('chat', 'employee-two', 'EMPLOYEE');
  assert.equal(result.assignedEmployeeId, null);
  assert.equal(conversation.assignedEmployeeId, 'employee-one');
  await assert.rejects(service.updateStatus('chat', 'employee-one', 'CLOSED'));
});

test('new conversation request reuses legacy conversation', async () => {
  const service = new ConversationService({ findOne: async () => ({ conversationId: 'existing', status: 'CLOSED' }) }, { findOne: async () => ({ adopterId: 'adopter' }) });
  assert.equal((await service.createConversation('adopter')).conversationId, 'existing');
});

test('message notifications include only sender identity; adopter sees support', async () => {
  const deliveries = [];
  const service = new NotificationsService({}, { findOneByOrFail: async () => ({ firstName: 'Test', lastName: 'Adopter' }), find: async () => [{ userId: 'recipient' }] }, {});
  service.createForUser = async (id, dto) => deliveries.push(dto);
  await service.createChatMessage('adopter', 'adopter', true);
  await service.createChatMessage('employee', 'adopter', false);
  assert.deepEqual(deliveries.map(d => d.message), ['New message from Test Adopter', 'New message from Petopia Support']);
  assert.ok(deliveries.every(d => d.type === 'MESSAGE'));
});

test('inbox returns previews and unread counts ordered by latest message, excluding empty chats', async () => {
  const conversations = ['older', 'newer', 'empty'].map(conversationId => ({ conversationId, createdAt: new Date('2026-01-01'), adopter: { userId: 'adopter' }, status: 'OPEN' }));
  const latest = { older: { messageText: 'Earlier', createdAt: new Date('2026-01-02') }, newer: { messageText: 'Latest', createdAt: new Date('2026-01-03') } };
  const messageRepo = {
    findOne: async ({ where }) => latest[where.conversationId] ?? null,
    createQueryBuilder: () => ({
      where(_sql, params) { this.id = params.id; return this; },
      andWhere() { return this; },
      async getCount() { return this.id === 'newer' ? 2 : 0; },
    }),
  };
  const service = new ConversationService({ find: async () => conversations, manager: { getRepository: () => messageRepo } }, {}, { owner: id => id === "newer" ? "employee-one" : null });
  const inbox = await service.getEmployeeConversations();
  assert.deepEqual(inbox.map(c => c.conversationId), ['newer', 'older']);
  assert.equal(inbox[0].lastMessage.messageText, 'Latest');
  assert.equal(inbox[0].unreadCount, 2);
  assert.equal(inbox[0].isInProgress, true);
  assert.equal(inbox[1].isInProgress, false);
});


test('simultaneous employee replies have only one winner', async () => {
  const f = setup();
  const results = await Promise.allSettled(['employee-one', 'employee-two'].map(id => f.service.sendMessage('chat', id, 'EMPLOYEE', { type: 'TEXT', messageText: 'Hello' })));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(f.messages.length, 1);
});

test('disconnect releases only after the owners last conversation tab leaves', async () => {
  const f = setup();
  f.presence.join('chat', 'employee-one', 'second-tab');
  await f.service.sendMessage('chat', 'employee-one', 'EMPLOYEE', { type: 'TEXT', messageText: 'Hello' });
  f.presence.disconnect('socket-one');
  assert.equal(f.presence.owner('chat'), 'employee-one');
  f.presence.disconnect('second-tab');
  assert.equal(f.presence.owner('chat'), null);
  assert.equal(await f.presence.reply('chat', 'employee-two', async () => 'sent'), 'sent');
});

test('failed initial reply releases ownership and disconnected employees cannot claim', async () => {
  const f = setup();
  await assert.rejects(f.presence.reply('chat', 'employee-one', async () => { throw new Error('save failed'); }));
  assert.equal(f.presence.owner('chat'), null);
  f.presence.disconnect('socket-one');
  await assert.rejects(f.service.sendMessage('chat', 'employee-one', 'EMPLOYEE', { type: 'TEXT', messageText: 'No' }));
});

for (const role of ['ADMIN', 'MANAGER']) {
  test(`${role} can reply to support after opening the conversation`, async () => {
    const f = setup();
    f.presence.join('chat', 'staff-user', 'staff-socket');
    await f.service.sendMessage('chat', 'staff-user', role, { type: 'TEXT', messageText: 'Support reply' });
    assert.equal(f.messages[0].senderId, 'staff-user');
  });
}
