// Run against Vite with VITE_USE_MOCKS=false and VITE_API_BASE_URL=/api.
// API responses are controlled fixtures; backend parsing has separate service tests.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.UI_TEST_URL || 'http://127.0.0.1:5175';
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      sessionStorage.setItem('petopia_auth_user', JSON.stringify({ id: 'user', name: 'Test Vet', email: 'vet@test.test', role: 'vet' }));
      sessionStorage.setItem('petopia_access_token', 'test-token');
    });
    const page = await context.newPage();
    let role = 'VET', importCalls = 0, deleteCalls = 0;
    let docs = Array.from({ length: 21 }, (_, i) => ({ fileId: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`, fileName: `record-${i + 1}.pdf`, mimeType: 'application/pdf', fileSize: 100, uploadedAt: '2026-09-24', category: 'DOCUMENT' }));
    const pet = { petId: 'pet', name: 'Daisy', species: 'Cat' };
    await page.route('**/api/**', async route => {
      const req = route.request(), path = new URL(req.url()).pathname.slice(4);
      let data = {};
      if (path === '/users/profile') data = { userId: 'user', firstName: 'Test', lastName: 'User', email: 'test@test.test', role: { roleName: role } };
      else if (path === '/pets') data = { data: [pet], total: 1 };
      else if (path.endsWith('/import/bulk')) {
        importCalls++;
        await new Promise(resolve => setTimeout(resolve, 700));
        assert.match(req.headers()['content-type'], /multipart\/form-data/);
        assert.match(req.postDataBuffer().toString(), /name="files"; filename="valid.pdf"/);
        data = { total: 2, importedRows: 1, failed: 1, partial: 0, results: [
          { index: 0, fileName: 'valid.pdf', success: true, summary: { imported: 1, failed: 0, errors: [] } },
          { index: 1, fileName: 'bad.pdf', success: false, error: { message: 'No valid records', errors: [{ row: 1, field: 'medicalDate', message: 'Invalid date' }] } }
        ] };
      } else if (path === '/files/documents/bulk') {
        deleteCalls++;
        const ids = req.postDataJSON().fileIds;
        assert.equal(ids.length, 20);
        data = { deleted: 19, failed: 1, results: ids.map((id, i) => ({ fileId: id, success: i !== 0, ...(i === 0 ? { error: 'Permission denied' } : {}) })) };
        docs = docs.filter(doc => !ids.slice(1).includes(doc.fileId));
      } else if (path.endsWith('/medical-record')) data = { pet, entries: [], documents: docs };
      else if (path === '/files') data = docs;
      else if (path.endsWith('/export/xml')) return route.fulfill({ contentType: 'application/xml', body: '<?xml version="1.0"?><adoptions></adoptions>' });
      else if (path.startsWith('/reports/')) data = { summary: { total: 1 }, data: [{ pet: 'Daisy' }] };
      else if (path.startsWith('/notifications')) data = { data: [], unreadCount: 0 };
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
    });
    await page.goto(`${base}/#/vet-medical/pet`);
    const input = page.getByLabel('Medical PDFs', { exact: true });
    await input.setInputFiles({ name: 'bad.csv', mimeType: 'text/csv', buffer: Buffer.from('x') });
    await page.getByRole('alert').filter({ hasText: 'Only PDF' }).waitFor();
    assert.equal(importCalls, 0);
    const pdf = name => ({ name, mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
    await input.setInputFiles(Array.from({ length: 21 }, (_, i) => pdf(`${i}.pdf`)));
    await page.getByRole('alert').filter({ hasText: 'no more than 20' }).waitFor();
    await input.setInputFiles([pdf('valid.pdf'), pdf('bad.pdf')]);
    await page.getByRole('button', { name: 'Import selected PDFs', exact: true }).click();
    await page.getByRole('progressbar').waitFor();
    await page.getByText('1 record(s) imported.', { exact: false }).waitFor();
    await page.getByText('Row 1 (medicalDate): Invalid date', { exact: false }).waitFor();
    assert.equal(importCalls, 1); console.log('Import passed');
    assert(await page.getByRole('button', { name: 'Import selected PDFs', exact: true }).isDisabled());
    await page.getByRole('button', { name: 'Delete multiple PDFs' }).click();
    await page.getByRole('button', { name: 'Select first 20 PDFs' }).click();
    assert(await page.getByRole('checkbox', { name: 'record-21.pdf', exact: true }).isDisabled());
    await page.getByRole('button', { name: 'Review deletion', exact: true }).click();
    assert.equal(deleteCalls, 0);
    await page.getByRole('button', { name: 'Delete selected PDFs', exact: true }).click();
    await page.getByText('19 deleted; 1 failed.').waitFor();
    await page.getByText('record-1.pdf: Permission denied').waitFor();
    assert.equal(await page.getByRole('checkbox', { checked: true }).count(), 1);
    assert.equal(deleteCalls, 1); console.log('Deletion passed');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    role = 'ADMIN';
    await page.goto(`${base}/#/admin-reports`);
    await page.reload();
    await page.getByRole('button', { name: 'Generate Report', exact: true }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export XML', exact: true }).click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'adoptions-report.xml');
    await page.goto(`${base}/#/admin-files`);
    await page.getByRole('button', { name: 'Delete multiple PDFs' }).click();
    await page.getByRole('checkbox', { name: 'record-1.pdf', exact: true }).waitFor();
    console.log('PASS: client validation, multipart import, row errors, selection cap, confirmed deletion, partial failure retention, mobile layout, XML download and admin bulk UI.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
