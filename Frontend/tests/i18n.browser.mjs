// Fixture-backed layout regression: run Vite with VITE_USE_MOCKS=false and VITE_API_BASE_URL=/api.
import { chromium } from 'playwright';
import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
const base = process.env.UI_TEST_URL || 'http://127.0.0.1:5175';
const root = resolve(import.meta.dirname, '..');
const bundle = await build({ entryPoints: [resolve(root, 'src/lib/mockApi.ts')], bundle: true, write: false, format: 'esm', platform: 'node', loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.jpeg': 'dataurl', '.svg': 'dataurl' }, define: { 'import.meta.env.VITE_USE_MOCKS': '"true"' } });
globalThis.sessionStorage = { getItem: () => null, setItem: () => {} };
globalThis.window = { setTimeout: callback => setTimeout(callback, 0) };
const { mockApiFetch } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const routes = {
  guest: ['home', 'about', 'pets', 'pet-detail/1', 'shop', 'login', 'signup', 'forgot-password', 'reset-password', 'verify-email', 'privacy', 'terms', 'status'],
  adopter: ['adopter-dashboard', 'settings', 'user-profile', 'my-requests', 'my-adoptions', 'orders', 'cart', 'friends', 'community', 'chats', 'support-chat', 'notifications'],
  employee: ['staff-dashboard', 'staff-pets', 'staff-requests', 'staff-adoptions', 'staff-chats', 'staff-orders', 'staff-inventory', 'staff-suppliers', 'staff-reports'],
  vet: ['vet-dashboard', 'vet-pets', 'vet-medical/1', 'vet-vaccinations/1', 'vet-profile'],
  manager: ['manager-dashboard', 'manager-analytics', 'manager-users', 'manager-inventory'],
  admin: ['admin-dashboard', 'admin-users', 'admin-departments', 'admin-orders', 'admin-inventory', 'admin-suppliers', 'admin-reports', 'admin-analytics', 'admin-roles', 'admin-files', 'admin-activity'],
};
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
const failures = []; let count = 0;
try {
  for (const [role, pages] of Object.entries(routes)) {
    await mockApiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email: `${role}@petopia.test` }) });
    for (const lang of ['en', 'ar', 'fr']) {
      const context = await browser.newContext();
      await context.addInitScript(({ role, lang }) => {
        if (role !== 'guest') {
          sessionStorage.setItem('petopia_access_token', 'test-token');
          sessionStorage.setItem('petopia_auth_user', JSON.stringify({ id: `mock-${role}`, name: 'Demo User', email: `${role}@petopia.test`, role }));
        }
        sessionStorage.setItem(`petopia_lang:${role === 'guest' ? 'guest' : `mock-${role}`}`, lang);
      }, { role, lang });
      const page = await context.newPage(); page.setDefaultTimeout(5000);
      let errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.route('**/api/**', async route => {
        const req = route.request(), url = new URL(req.url()), path = url.pathname.slice(4);
        let json;
        if (['/friends', '/friend-requests', '/direct-conversations', '/community/messages', '/community/blocks', '/files'].includes(path)) json = [];
        else if (path === '/community/access') json = { blocked: false };
        else if (path === '/health') json = { status: 'alive' };
        else if (path === '/ready') json = { status: 'ready', db: { ok: true } };
        else json = await mockApiFetch(path + url.search, { method: req.method(), body: req.postData() || undefined });
        if (path.startsWith('/dashboard/') && json?.activity) json.activity.recentActivityLogs = [{ logId: 'log', action: 'PET_CREATED', entityType: 'PET', createdAt: new Date().toISOString(), user: null }];
        await route.fulfill({ json: json ?? {} });
      });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 900 });
        for (const path of pages) {
          const label = `${role}/${path}/${lang}/${width}`;
          if (process.env.UI_TEST_FILTER && !label.includes(process.env.UI_TEST_FILTER)) continue;
          errors = [];
          try {
            await page.goto(`${base}/#/${path}`);
            await page.waitForFunction(lang => document.documentElement.lang === lang, lang);
            await page.waitForFunction(() => document.body.innerText.length > 50);
            await page.waitForTimeout(350);
            assert.equal(await page.locator('html').getAttribute('dir'), lang === 'ar' ? 'rtl' : 'ltr');
            assert((await page.locator('body').innerText()).length > 50, 'page did not render');
            assert.deepEqual(errors, [], 'browser errors');
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
            assert(overflow <= 1, `page overflows by ${overflow}px`);
            const sidebar = page.locator('.dashboard-sidebar');
            if (width === 1440 && await sidebar.count()) {
              const box = await sidebar.boundingBox();
              assert(lang === 'ar' ? box.x > width / 2 : box.x < width / 2, 'sidebar not mirrored');
            }
            if (['friends', 'community', 'status'].includes(path) && lang !== 'en') {
              const body = await page.locator('body').innerText();
              for (const english of ['Main navigation', 'Community chat', 'System Status', 'No friends yet', 'Support Chat']) assert(!body.includes(english), `English UI remains: ${english}`);
            }
            count++;
          } catch (error) { failures.push(`${label}: ${error.message}; language=${await page.locator("html").getAttribute("lang")}; errors=${errors.join("; ")}; body=${(await page.locator("body").innerText()).slice(0, 120)}`); console.error(failures.at(-1)); }
        }
      }
      await context.close();
    }
    console.log(`Checked ${role} routes in English, Arabic and French on desktop and mobile.`);
  }
  assert.deepEqual(failures, []);
  console.log(`PASS: ${count} route/language/viewport checks, RTL sidebar mirroring and no browser errors.`);
} finally { await browser.close(); }
