import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ConflictException, ValidationPipe, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { SignupDto, LoginDto } from '@shared/dto/auth.dto';
import { ForgotPasswordDto } from '@shared/dto/forgot-password.dto';
import { AuthService } from '../../src/modules/auth/auth.service';
import { OAuthService } from '../../src/modules/oauth/oauth.service';

const variants = ['Test@Email.com', 'TEST@EMAIL.COM', 'test@email.com', '  Test@Email.com  '];
const password = 'Password123!';
const signup = (email: string) => ({ email, password, confirmPassword: password, firstName: 'Test', lastName: 'User' });

function fixture(initialUser: any = null) {
  let user = initialUser;
  const lookups: string[] = []; const sent: Array<{ to: string; link: string }> = [];
  const tokens: any[] = []; const deletedTokens: any[] = [];
  const role = { roleId: 'role', roleName: 'ADOPTER', isActive: true };
  const repo = {
    findOne: async ({ where }: any) => {
      const condition = where.email;
      assert.equal(condition.getSql('u.email'), 'LOWER(BTRIM(u.email)) = :email');
      const email = condition.objectLiteralParameters.email;
      lookups.push(email);
      return user?.email.trim().toLowerCase() === email ? user : null;
    },
    create: (value: any) => value,
    save: async (value: any) => { user = { ...value, userId: 'user', refreshTokenVersion: 0 }; return user; },
  };
  const basicRepo = { create: (value: any) => value, save: async (value: any) => value };
  const roles = { findOne: async () => role };
  const dataSource = { transaction: async (fn: any) => fn({
    getRepository: (entity: any) => entity.name === 'User' ? repo : basicRepo,
  }) };
  const auth = new AuthService(repo as any, roles as any, {
    create: (value: any) => value,
    save: async (value: any) => { tokens.push(value); return value; },
    delete: async (value: any) => { deletedTokens.push(value); },
  } as any, basicRepo as any, dataSource as any, { sign: () => 'jwt' } as any,
  { get: () => undefined } as any,
  { sendPasswordResetEmail: async (to: string, link: string) => { sent.push({ to, link }); } } as any);
  return { auth, repo, roles, basicRepo, dataSource, lookups, sent, tokens, deletedTokens, getUser: () => user };
}

test('DTOs normalize before email validation and still reject invalid values', async () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
  for (const email of variants) {
    for (const metatype of [SignupDto, LoginDto, ForgotPasswordDto]) {
      const body = metatype === SignupDto ? signup(email) : metatype === LoginDto ? { email, password } : { email };
      const dto = await pipe.transform(body, { type: 'body', metatype });
      assert.equal(dto.email, 'test@email.com');
    }
  }
  for (const email of [null, 42, {}, '', 'bad email']) {
    await assert.rejects(() => pipe.transform({ email }, { type: 'body', metatype: ForgotPasswordDto }), BadRequestException);
  }
});

test('signup stores normalized email and rejects all case variants as duplicates', async () => {
  for (const email of variants) {
    const f = fixture();
    await f.auth.signup(signup(email));
    assert.equal(f.getUser().email, 'test@email.com');
    for (const duplicate of variants) await assert.rejects(() => f.auth.signup(signup(duplicate)), ConflictException);
    assert.ok(f.lookups.every((value) => value === 'test@email.com'));
  }
  const legacy = fixture({ email: 'Test@Email.com', provider: 'LOCAL' });
  await assert.rejects(() => legacy.auth.signup(signup('TEST@EMAIL.COM')), ConflictException);
});

test('login matches normalized and legacy mixed-case accounts for every input variant', async () => {
  const hash = await bcrypt.hash(password, 4);
  for (const storedEmail of ['test@email.com', 'Test@Email.com']) {
    const f = fixture({ email: storedEmail, userId: 'user', password: hash, provider: 'LOCAL', status: 'active',
      role: { roleName: 'ADOPTER', isActive: true }, refreshTokenVersion: 0 });
    for (const email of variants) {
      const result = await f.auth.login({ email, password });
      assert.equal(result.user.email, storedEmail);
      assert.equal(result.accessToken, 'jwt');
    }
    assert.ok(f.lookups.every((value) => value === 'test@email.com'));
  }
});

test('forgot-password always sends to stored email and retains token/reset behavior', async () => {
  const f = fixture({ userId: 'user', email: 'Test@Email.com', password: 'hash' });
  for (const email of variants) await f.auth.forgotPassword({ email });
  assert.equal(f.sent.length, variants.length);
  assert.ok(f.sent.every(({ to, link }) => to === 'Test@Email.com' && /^http:\/\/localhost:5173\/#\/reset-password\?token=[a-f0-9]{64}$/.test(link)));
  assert.ok(f.lookups.every((value) => value === 'test@email.com'));
  assert.ok(f.tokens.every((token) => token.userId === 'user' && token.tokenHash.length === 64 && token.expiresAt > new Date()));
  assert.deepEqual(f.deletedTokens, variants.map(() => ({ userId: 'user' })));
  const missing = fixture(); const noPassword = fixture({ email: 'test@email.com', password: null });
  assert.deepEqual(await missing.auth.forgotPassword({ email: variants[0] }), await noPassword.auth.forgotPassword({ email: variants[1] }));
  assert.equal(missing.sent.length + noPassword.sent.length, 0);
  assert.equal(missing.tokens.length + noPassword.tokens.length, 0);
});

test('Google email normalization preserves local-account conflict and normalizes new storage', async () => {
  for (const email of variants) {
    for (const initialUser of [null, { email: 'Test@Email.com', provider: 'LOCAL' }]) {
      const f = fixture(initialUser);
      const oauth = new OAuthService(f.repo as any, { findOne: async () => null } as any,
        f.basicRepo as any, f.roles as any, f.dataSource as any,
        { createAuthTokens: async () => ({}) } as any, { get: () => undefined } as any);
      const data = { providerUserId: 'google-id', email, emailVerified: true, firstName: 'Test', lastName: 'User' };
      if (initialUser) await assert.rejects(() => oauth.validateGoogleUser(data), ConflictException);
      else { await oauth.validateGoogleUser(data); assert.equal(f.getUser().email, 'test@email.com'); }
      assert.deepEqual(f.lookups, ['test@email.com']);
    }
  }
});
