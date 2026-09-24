# Data transfer UI regression check

Start the frontend with real API mode (the browser test intercepts API calls):

```sh
VITE_USE_MOCKS=false VITE_API_BASE_URL=/api npm run dev -w pet-adoption-frontend -- --host 127.0.0.1 --port 5175
```

Then run:

```sh
node Frontend/test/data-transfer.test.cjs
```

Set `CHROME_PATH` to a local Chrome executable if Playwright's Chromium is not installed.
Set `UI_TEST_URL` if using a different frontend address.

This checks PDF selection and limits, multipart submission, per-row import errors,
partial-success results, capped bulk selection, deletion confirmation, retention of
failed items, mobile overflow, XML download, and the admin file-management controls.
API responses are fixtures; backend PDF parsing and database rollback behavior are
covered separately by `npm test -w pet-adoption-backend` with repository doubles.
No production data is changed by this test.
