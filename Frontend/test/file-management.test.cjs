const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.UI_TEST_URL || 'http://127.0.0.1:5175';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      sessionStorage.setItem('petopia_access_token', 'test-token');
      sessionStorage.setItem('petopia_auth_user', JSON.stringify({ id: 'admin', name: 'Test Admin', email: 'admin@test.test', role: 'admin' }));
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const id = '11111111-1111-4111-8111-111111111111';
    let files = [
      { fileId: id, fileName: 'medical.pdf', fileUrl: `/files/${id}`, category: 'DOCUMENT', mimeType: 'application/pdf', canDelete: true },
      { fileId: '22222222-2222-4222-8222-222222222222', fileName: 'avatar.png', fileUrl: '/files/avatar', category: 'AVATAR', mimeType: 'image/png', canDelete: false },
    ].map(file => ({ ...file, fileSize: 100, uploadedAt: '2026-09-24' }));
    let deletes = 0, forbiddenPreview = false;
    await page.route('**/api/**', async route => {
      const req = route.request(), path = new URL(req.url()).pathname.slice(4);
      if (path === '/users/profile') return route.fulfill({ json: { userId: 'admin', firstName: 'Test', lastName: 'Admin', email: 'admin@test.test', role: { roleName: 'ADMIN' } } });
      if (path === '/files') return route.fulfill({ json: files });
      if (path.startsWith('/files/')) {
        assert.equal(req.headers().authorization, 'Bearer test-token');
        if (req.method() === 'DELETE') { deletes++; files = files.filter(file => file.fileId !== id); return route.fulfill({ json: { message: 'Deleted' } }); }
        if (forbiddenPreview) return route.fulfill({ status: 403, json: { message: 'Forbidden' } });
        if (path.endsWith('avatar')) return route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9b8AAAAASUVORK5CYII=', 'base64') });
        return route.fulfill({ contentType: 'application/pdf', body: '%PDF-1.4\n%%EOF' });
      }
      return route.fulfill({ json: path.startsWith('/notifications') ? { data: [], unreadCount: 0 } : {} });
    });
    await page.goto(`${base}/#/admin-files`);
    await page.getByRole('button', { name: 'Preview: medical.pdf', exact: true }).click();
    await page.locator('iframe[title="medical.pdf"]').waitFor();
    assert.match(await page.locator('iframe').getAttribute('src'), /^blob:/);
    await page.getByRole('button', { name: 'Close preview', exact: true }).click();
    await page.getByRole('button', { name: 'Preview: avatar.png', exact: true }).click();
    await page.getByRole('dialog').getByRole('img', { name: 'avatar.png' }).waitFor();
    await page.keyboard.press('Escape');
    assert(await page.getByRole('button', { name: 'Delete: avatar.png', exact: true }).isDisabled());
    forbiddenPreview = true;
    await page.getByRole('button', { name: 'Preview: medical.pdf', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Unable to preview' }).waitFor();
    assert.equal(await page.locator('iframe').count(), 0);
    await page.keyboard.press('Escape');
    forbiddenPreview = false;
    await page.getByRole('button', { name: 'Delete: medical.pdf', exact: true }).click();
    assert.equal(deletes, 0);
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('button', { name: 'Preview: medical.pdf', exact: true }).waitFor({ state: 'detached' });
    assert.equal(deletes, 1);
    await page.getByRole('button', { name: 'Grid', exact: true }).click();
    await page.getByRole('button', { name: 'Preview: avatar.png', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log('PASS: authenticated PDF/image previews, denied preview, deletion permissions, confirmation, refresh and mobile grid.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
