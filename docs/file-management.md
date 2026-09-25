# File upload and management

The admin Files page lists managed uploads through authenticated `GET /files`.
Only admins can list files; the response contains file metadata and uploader names,
never account credentials or full user objects. Existing retrieval and deletion
rules still apply. The page disables deletion when the current admin cannot delete
an avatar belonging to another admin. External and unassociated avatars are omitted.

Images have thumbnails; images and PDFs can be previewed in an accessible dialog.
Previews fetch the file with the current session token, display only supported
image/PDF content, report failures, and release temporary blob URLs when closed.
Medical documents also have preview controls in the veterinary medical page.
The file list supports search, category filtering and pagination.

All real multipart requests made through the shared API client show measured upload
progress, including avatar, pet/supply image, community photo and medical uploads.
A completed transfer displays a processing state until the server responds; it does
not imply the file was accepted. Existing validation, token refresh and error
handling remain active. The progress panel clears on completion, failure or abort.
New preview/progress labels have English, Arabic and French translations.

## Verification

```sh
npm test -w pet-adoption-backend
npm run backend:build
npm run frontend:build
npx tsc --noEmit -p Frontend/tsconfig.json
```

The full frontend typecheck currently reports existing repository errors. Comparing
with the committed baseline found no additional diagnostics from this change. Both
production builds pass.

The backend file workflow test uses temporary physical files and repository doubles.
It checks safe listing, image/PDF storage and retrieval, unauthorized access and
deletion, removal of physical files and metadata, and invalid-file cleanup.
It does not modify the application database.

Start a separate frontend for browser checks:

```sh
VITE_USE_MOCKS=false VITE_API_BASE_URL=/api npm run dev -w pet-adoption-frontend -- --host 127.0.0.1 --port 5175
```

Then run:

```sh
CHROME_PATH=/usr/bin/google-chrome node Frontend/test/file-management.test.cjs
CHROME_PATH=/usr/bin/google-chrome node Frontend/test/data-transfer.test.cjs
CHROME_PATH=/usr/bin/google-chrome node Frontend/test/upload-progress.test.cjs
```

Set `CHROME_PATH` to your Chrome executable and `UI_TEST_URL` if using another
frontend address. File-management/data-transfer browser checks use API fixtures.
The progress check transfers multipart data to a temporary local HTTP server and
checks actual browser progress events, the processing state and abort cleanup.

For a live demonstration, upload an image through pet management and a PDF through
medical records. As an admin, open Files, search for them, preview both, and delete
them with confirmation. Verify the list refreshes and deleted URLs no longer work.
Use only disposable demo files. Restart/rebuild the application containers to serve
these source changes; no database migration is required.
