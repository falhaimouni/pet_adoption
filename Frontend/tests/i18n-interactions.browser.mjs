import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
const base = process.env.UI_TEST_URL || 'http://127.0.0.1:5175';
const errors = [];
async function watch(page) { page.setDefaultTimeout(7000); page.on('pageerror', error => errors.push(error.message)); }
async function change(page, language) {
  await page.locator('select').filter({ has: page.locator('option[value="fr"]') }).first().selectOption(language);
  await page.waitForFunction(lang => document.documentElement.lang === lang, language);
}
try {
  const guest = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await guest.newPage(); await watch(page);
  await page.goto(`${base}/#/login`);
  await page.getByLabel('Email', { exact: true }).fill('sara@example.com');
  await page.getByLabel('Password', { exact: true }).fill('SamplePassword123!');
  for (const lang of ['ar', 'fr', 'en']) {
    await change(page, lang);
    assert.equal(await page.locator('input[type="email"]').inputValue(), 'sara@example.com');
    assert.equal(await page.locator('input[type="password"]').inputValue(), 'SamplePassword123!');
    assert.equal(await page.locator('input[type="email"]').evaluate(el => getComputedStyle(el).direction), 'ltr');
  }
  await change(page, 'ar');
  await page.getByRole('button', { name: 'إظهار كلمة المرور', exact: true }).click();
  const revealed = page.locator('input[type="text"]');
  assert.equal(await revealed.inputValue(), 'SamplePassword123!');
  assert.equal(await revealed.evaluate(el => getComputedStyle(el).direction), 'ltr');
  await page.reload(); await page.waitForFunction(() => document.documentElement.lang === 'ar');
  await guest.close();

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    sessionStorage.setItem('petopia_access_token', 'test-token');
    sessionStorage.setItem('petopia_auth_user', JSON.stringify({ id: 'vet', name: 'Test Vet', email: 'vet@test.test', role: 'vet' }));
  });
  const p = await context.newPage(); await watch(p);
  await p.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.slice(4);
    let json = {};
    if (path === '/users/profile') json = { userId: 'vet', firstName: 'Test', lastName: 'Vet', email: 'vet@test.test', role: { roleName: 'VET' } };
    else if (path === '/pets') json = { data: [{ petId: 'pet', name: 'Daisy', species: 'Cat' }], total: 1 };
    else if (path.endsWith('/medical-record')) json = { pet: { petId: 'pet', name: 'Daisy' }, entries: [], documents: [] };
    else if (path.startsWith('/notifications')) json = { data: [], unreadCount: 0 };
    else if (path === '/community/access') json = { blocked: false };
    else if (path === '/community/messages') json = [{ id: 'message', text: 'User-authored text', sender: { id: 'vet', name: 'Test Vet', role: 'VET' }, createdAt: new Date().toISOString() }];
    await route.fulfill({ json });
  });
  await p.goto(`${base}/#/vet-medical/pet`);
  await change(p, 'ar');
  await p.getByRole('button', { name: 'القائمة الرئيسية', exact: true }).click();
  await p.waitForTimeout(350);
  let box = await p.locator('.dashboard-sidebar').boundingBox();
  assert(Math.abs(box.x + box.width - 390) <= 1, 'Arabic mobile sidebar attaches to right edge');
  await p.locator('.dashboard-sidebar').getByRole('button', { name: 'إغلاق', exact: true }).click();
  await change(p, 'fr');
  await p.getByRole('button', { name: 'Menu principal', exact: true }).click();
  await p.waitForTimeout(350);
  box = await p.locator('.dashboard-sidebar').boundingBox();
  assert(Math.abs(box.x) <= 1, 'French mobile sidebar attaches to left edge');
  await p.locator('.dashboard-sidebar').getByRole('button', { name: 'Fermer', exact: true }).click();
  await p.locator('input[type="file"]').first().setInputFiles({ name: 'bad.csv', mimeType: 'text/csv', buffer: Buffer.from('x') });
  await p.getByRole('alert').filter({ hasText: 'Seuls les documents PDF sont autorisés.' }).waitFor();
  await p.goto(`${base}/#/community`);
  await change(p, 'ar');
  await p.getByRole('button', { name: 'خيارات الرسالة', exact: true }).click();
  const menu = p.getByRole('menu'); await menu.waitFor();
  assert.equal(await menu.getAttribute('dir'), 'rtl', 'portal menu inherits Arabic direction');
  const menuBox = await menu.boundingBox();
  assert(menuBox.x >= 0 && menuBox.x + menuBox.width <= 390, 'portal menu stays in viewport');
  await p.keyboard.press('Escape');
  assert.deepEqual(errors, []);
  await context.close();
  console.log('PASS: live language switching, preserved form values, persistence, LTR credentials, mobile sidebar mirroring, French import validation and RTL portal menu.');
} finally { await browser.close(); }
