const { createServer } = require('node:http');
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const server = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization');
    if (req.method === 'OPTIONS') { res.end(); return; }
    req.resume();
    req.on('end', () => setTimeout(() => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
    }, 500));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
  try {
    const page = await browser.newPage();
    await page.goto(process.env.UI_TEST_URL || 'http://127.0.0.1:5175');
    const result = await page.evaluate(async url => {
      const { uploadRequest, getUploads, subscribeUploads } = await import('/src/lib/uploadTransport.ts');
      const snapshots = [];
      const unsubscribe = subscribeUploads(() => snapshots.push(getUploads().map(upload => ({ ...upload }))));
      const body = new FormData();
      body.append('file', new File([new Uint8Array(1024 * 1024)], 'large.png', { type: 'image/png' }));
      const response = await uploadRequest(url, { body, headers: { Authorization: 'Bearer test' } });
      const data = await response.json();
      const controller = new AbortController();
      const pending = uploadRequest(url, { body, signal: controller.signal });
      controller.abort();
      let aborted = false;
      try { await pending; } catch (error) { aborted = error.name === 'AbortError'; }
      const pendingAfterAbort = getUploads().length;
      unsubscribe();
      return { snapshots, data, aborted, pendingAfterAbort };
    }, `http://127.0.0.1:${server.address().port}/upload`);
    assert.equal(result.data.ok, true);
    assert(result.snapshots.some(snapshot => snapshot.some(upload => upload.percent === 100 && upload.processing)));
    assert.equal(result.aborted, true);
    assert.equal(result.pendingAfterAbort, 0);
    console.log('PASS: real multipart transfer reports measured progress, distinguishes processing, and clears aborted/completed uploads.');
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
