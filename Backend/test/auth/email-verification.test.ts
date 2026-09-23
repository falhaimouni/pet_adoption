import 'reflect-metadata';
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/modules/auth/auth.service';
import { createHash } from 'crypto';

function service(user: any, resets: any = {}, mail: any = {}) {
  const repo = { findOne: async () => user, ...user?.repo };
  return new AuthService(repo as any, {} as any, resets, {} as any, {} as any, {} as any, {} as any, mail);
}

test('correct password cannot log in before email verification', async () => {
  const auth = service({ password: await bcrypt.hash('Password123!', 4), provider: 'LOCAL', role: { isActive: true }, emailVerified: false });
  await assert.rejects(auth.login({ email: 'test@example.com', password: 'Password123!' }), /verify your email/);
});

test('unverified accounts cannot obtain tokens through alternate issuance', async () => {
  const auth = service({ emailVerified: false, status: 'active', role: { isActive: true } });
  await assert.rejects(auth.createAuthTokens('user'), /verify your email/);
});

test('reset email comes from token owner and rejects expired or consumed tokens', async () => {
  let record: any = { user: { email: 'owner@example.com' }, expiresAt: new Date(Date.now() + 10000) };
  const auth = service(null, { findOne: async ({ where }: any) => {
    assert.equal(where.tokenHash, createHash('sha256').update('token').digest('hex'));
    return record;
  } });
  assert.deepEqual(await auth.passwordResetContext('token'), { email: 'owner@example.com' });
  record.usedAt = new Date();
  await assert.rejects(auth.passwordResetContext('token'), /Invalid or expired/);
  record.usedAt = null;
  record.expiresAt = new Date(0);
  await assert.rejects(auth.passwordResetContext('token'), /Invalid or expired/);
  record = null;
  await assert.rejects(auth.passwordResetContext('token'), /Invalid or expired/);
});

test('resend does not send mail for verified or nonexistent accounts', async () => {
  for (const user of [null, { emailVerified: true }]) {
    const auth = service(user, {}, { sendVerificationEmail: () => assert.fail('unexpected email') });
    assert.match((await auth.resendVerification('test@example.com')).message, /If your account/);
  }
});

test('verification rejects missing, expired, or already consumed links', async () => {
  const query: any = {};
  for (const method of ['update', 'set', 'where', 'andWhere']) query[method] = () => query;
  query.execute = async () => ({ affected: 0 });
  const auth = service({ repo: { createQueryBuilder: () => query } });
  await assert.rejects(auth.verifyEmail('token'), /Invalid or expired verification/);
  query.execute = async () => ({ affected: 1 });
  assert.match((await auth.verifyEmail('token')).message, /Email verified/);
});

test('signup stores only a token hash and emails the raw verification link', async () => {
  let created: any;
  let emailedLink = '';
  const repository = {
    create: (data: any) => data,
    save: async (data: any) => {
      if (data.email) created = { ...data, userId: 'new-user' };
      return { ...data, userId: 'new-user' };
    },
  };
  const auth = new AuthService(
    { findOne: async () => null } as any,
    { findOne: async () => ({ roleName: 'ADOPTER', isActive: true }) } as any,
    {} as any, {} as any,
    { transaction: async (fn: any) => fn({ getRepository: () => repository }) } as any,
    {} as any,
    { get: () => 'https://petopia.example' } as any,
    { sendVerificationEmail: async (email: string, link: string) => {
      assert.equal(email, 'new@example.com');
      emailedLink = link;
    } } as any,
  );
  await auth.signup({ firstName: 'New', lastName: 'User', email: 'new@example.com', password: 'Password123!', confirmPassword: 'Password123!' });
  assert.equal(created.emailVerified, false);
  assert.ok(created.emailVerificationExpiresAt > new Date());
  const raw = new URLSearchParams(new URL(emailedLink).hash.split('?')[1]).get('token')!;
  assert.equal(raw.length, 64);
  assert.notEqual(created.emailVerificationHash, raw);
  assert.equal(created.emailVerificationHash, createHash('sha256').update(raw).digest('hex'));
});

test('signup surfaces verification email delivery failures', async () => {
  const repository = {
    create: (data: any) => data,
    save: async (data: any) => ({ ...data, userId: 'new-user' }),
  };
  const auth = new AuthService(
    { findOne: async () => null } as any,
    { findOne: async () => ({ roleName: 'ADOPTER', isActive: true }) } as any,
    {} as any, {} as any,
    { transaction: async (fn: any) => fn({ getRepository: () => repository }) } as any,
    {} as any,
    { get: () => 'https://petopia.example' } as any,
    { sendVerificationEmail: async () => { throw new Error('smtp timeout'); } } as any,
  );
  await assert.rejects(
    auth.signup({ firstName: 'New', lastName: 'User', email: 'new@example.com', password: 'Password123!', confirmPassword: 'Password123!' }),
    /could not send the verification email/,
  );
});

test('signup resends verification for an existing unverified local account', async () => {
  let updateCriteria: any;
  let updatePayload: any;
  let emailed = '';
  const user: any = { userId: 'user-1', email: 'new@example.com', provider: 'LOCAL', status: 'active', emailVerified: false };
  user.repo = {
    update: async (criteria: any, payload: any) => {
      updateCriteria = criteria;
      updatePayload = payload;
    },
  };
  const auth = new AuthService(
    { findOne: async () => user, ...user.repo } as any,
    { findOne: async () => ({ roleName: 'ADOPTER', isActive: true }) } as any,
    {} as any, {} as any,
    {} as any,
    {} as any,
    { get: () => 'https://petopia.example' } as any,
    {
      sendVerificationEmail: async (_email: string, link: string) => {
        emailed = link;
      },
    } as any,
  );

  assert.match(
    (await auth.signup({ firstName: 'New', lastName: 'User', email: 'new@example.com', password: 'Password123!', confirmPassword: 'Password123!' })).message,
    /Verification email sent/,
  );
  assert.deepEqual(updateCriteria, { userId: 'user-1', emailVerified: false });
  assert.ok(updatePayload.emailVerificationExpiresAt > new Date());
  const raw = new URLSearchParams(new URL(emailed).hash.split('?')[1]).get('token')!;
  assert.equal(updatePayload.emailVerificationHash, createHash('sha256').update(raw).digest('hex'));
});
