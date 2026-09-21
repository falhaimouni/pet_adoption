# Pet Adoption Management System — QA Handoff

Prepared: 20 September 2026  
Source baseline: commit `f661de4`, plus the working tree available on the preparation date.  
Status: source-reviewed test plan; application tests have **not** been executed for this handoff.

This document covers manual functional, integration, access-control, and usability testing of the pet adoption application. Expected results describe the behavior to verify, not a claim that the application already passes. Source-observed limitations are listed in section 8.

## 1. Information to complete before testing

| Item | Value |
| --- | --- |
| QA website URL | To be supplied by the environment owner |
| QA API base URL | To be supplied by the environment owner |
| Deployed build / commit | Record the actual deployed version |
| QA tester and test dates | To be completed |
| Developer / product contact | To be supplied |
| Bug tracker / reporting channel | To be supplied |
| Account credentials | Share separately through the team's approved channel |
| Email reset and Google login configured? | Environment owner to confirm separately for each integration |
| Approved browsers / release scope | Product owner to confirm; suggested coverage is in section 7 |

Use a dedicated QA database and synthetic records. Use separate browser profiles for simultaneous users. Keep mocks disabled (`VITE_USE_MOCKS=false`) for integration testing; results from mock mode do not demonstrate backend functionality.

### Accounts and test data

Prepare one active account for each role: **adopter, employee, vet, manager, admin**. Also prepare a second adopter for ownership checks and a disposable inactive account for login tests.

Development seeds define `adopter1@test.com`, `adopter2@test.com`, `support@test.com` (employee), `vet@test.com`, and `manager@test.com`. These accounts exist only if the corresponding seed was run; have the environment owner supply a QA admin and verify credentials. Password-reset testing needs a controlled mailbox that can receive mail, rather than an assumed seed inbox.

Use records named `QA-<date>-<case ID>` so results are easy to trace. Prepare:

- Separate available pets for approval, rejection, cancellation, and concurrency tests; one adopted pet and one pet on medical hold.
- A supplier, a listed active supply/product with positive quantity and price, an unlisted supply, and a zero-stock supply.
- One pet with a medical record, an entry, and a vaccination; a disposable department and staff member.
- Valid JPEG, PNG, WebP, and PDF fixtures; files just below and above the upload limits; a harmless text file renamed to `.jpg`.
- Enough records for more than one page of results, plus a new adopter with no requests or adoptions.

## 2. Getting access to the application

If QA receives a running environment, use the supplied URL and start with the smoke tests. The following setup notes are for the person preparing a local QA environment.

### Docker environment

The current Compose configuration exposes the frontend at **`https://localhost:8443`** by default. The API is proxied through **`https://localhost:8443/api`**. PostgreSQL and the backend do not publish host ports in this configuration. This differs from older setup examples in the root README.

1. Have the environment owner prepare `.env.development` from `.env.example` if it does not already exist, with database credentials, JWT secrets, and any integration settings.
2. From the repository root, start the stack:

   ```bash
   docker compose --env-file .env.development up --build -d
   docker compose --env-file .env.development ps
   docker compose --env-file .env.development logs db-seed
   ```

3. Check backend readiness at `/api/ready`: the body should contain `status: "ready"` and `db.ok: true`. `/api/health` returns `status: "alive"`; liveness alone does not establish database readiness.
4. Open the frontend. The bundled local setup generates a development certificate; use the team's local certificate trust procedure.

Compose includes monitoring and backup services, so their configuration must also be supplied for the full stack. Production-mode backend startup runs migrations. The `db-seed` service runs the full development seed only if the users table is empty. A nonempty database does not guarantee that all QA fixtures exist. Rerunning development seeds updates existing seeded users, including their passwords and roles; the environment owner should manage resets.

### Native development alternative

Use Node.js 20+, npm, and a separately accessible PostgreSQL 15 database. In the root `.env.development`, set `NODE_ENV=development`, `POSTGRES_HOST` to the reachable database host, the correct database credentials, `PORT=3000`, and `FRONTEND_URL=http://localhost:5173`. If `FRONTEND_URLS` is present, it takes precedence and must include the frontend origin.

Prepare `Frontend/.env.local` from `Frontend/.env.example` if needed, with `VITE_USE_MOCKS=false` and `VITE_API_BASE_URL=http://localhost:3000`. Then run from the repository root:

```bash
npm ci
npm run migration:run
npm run seed -w pet-adoption-backend
npm run backend:dev
```

Start the frontend in another terminal:

```bash
npm run frontend:dev
```

The usual URLs are `http://localhost:5173` and `http://localhost:3000`. Use the actual port printed by Vite. Native API URLs have no `/api` prefix. These setup commands are documented from configuration and were not run for this handoff.

## 3. Roles and navigation

The frontend uses hash routes, for example `https://localhost:8443/#/login`. Use the sidebar for normal navigation and direct URLs for access-control tests.

| Role | Landing route | Main test areas |
| --- | --- | --- |
| Visitor | `#/home` | About, terms, privacy, pets, pet details, signup, login, password recovery, system status |
| Adopter | `#/adopter-dashboard` | Pets, own requests/adoptions, shop/cart, profile, settings, notifications, chat screens |
| Employee | `#/staff-dashboard` | Pets, adoption review, adoptions, inventory, suppliers, orders, permitted reports, chat screens |
| Vet | `#/vet-dashboard` | Pets, medical entries/documents, vaccinations, pet reports, profile |
| Manager | `#/manager-dashboard` | Pets, adoption review, inventory, suppliers, orders, permitted user management, reports, analytics, read-only chat screens |
| Admin | `#/admin-dashboard` | Operations, user administration, departments, reports, analytics, activity; role and file screens with limitations below |

Other useful routes: `#/pets`, `#/pet-detail/<petId>`, `#/my-requests`, `#/my-adoptions`, `#/shop`, `#/cart`, `#/user-profile`, `#/settings`, `#/notifications`, `#/vet-medical/<petId>`, `#/vet-vaccinations/<petId>`.

### Permission boundaries to verify

| Action | Allowed roles / restriction |
| --- | --- |
| Browse public pets and details | Visitors and authenticated users at API level; staff use their role-specific pet pages |
| Submit/cancel adoption request | Adopter; cancellation only for their own pending request |
| Review adoption request | Employee, manager, admin |
| Create/edit pets and upload pet images | Employee, manager, admin |
| Archive pets | Manager, admin |
| Read medical records | Vet, manager, admin |
| Create/edit/delete medical entries and vaccinations; upload medical documents | Vet only, including when testing an admin account |
| Read vaccinations | Vet, employee, manager, admin |
| Create/edit inventory and suppliers | Employee, manager, admin |
| Delete inventory/suppliers | Manager, admin |
| Browse shop and manage cart | Adopter |
| View staff order list | Employee, manager, admin |
| Create staff users; deactivate users; manage departments | Admin, subject to user hierarchy and last-active-admin safeguards |
| Manage other user profiles | Manager/admin, subject to lower-role and field restrictions; manager cannot assign roles |
| Export adoption reports | Employee, manager, admin |
| Export inventory reports | Manager, admin |
| Export pet reports | Vet, employee, manager, admin |

Check both hidden/disabled UI actions and direct API requests. A hidden button alone is not an authorization test. Checkout endpoints currently require a JWT but have no role guard; include this in the access review rather than assuming the adopter-only UI enforces API permissions.

## 4. Business behavior that affects expected results

### Adoption

- Submitting a request for an **AVAILABLE** pet creates a **PENDING** request and changes the pet to **PENDING**. Further submissions for that pet are blocked while it is pending, including submissions by a different adopter.
- Approval changes the request to **APPROVED**, the pet to **ADOPTED**, and creates an adoption record with a pending contract. Do not assume a contract signing or fee collection workflow exists.
- Rejection or cancellation of the last pending request returns a non-adopted pet to **AVAILABLE**. Only pending requests can be reviewed or canceled.
- A rejected/canceled request may be reused when the same adopter applies again for an available pet; a new request ID is not required.
- Approval also rejects any competing pending requests already present in the data. This scenario needs prepared legacy/seed fixtures because normal submission makes the pet pending immediately.
- The adoption service uses `CANCELLED`, while a shared enum uses `CANCELED`. Check displayed labels and filters across both spellings; report inconsistencies.

### Store and checkout

- Checkout is **cash only**. The current cart button makes two API calls: create a pending order, then pay it immediately. Successful UI checkout records a **COMPLETED** order and a **CASH / PAID** payment, then clears the cart.
- API-only creation (`POST /checkout`) leaves the order **PENDING**, with the cart intact and no payment. A pending order can then be paid or canceled through the API. Cancellation leaves the cart intact.
- Order totals use database product prices, with order-line price snapshots. Required delivery fields are recipient name, phone number, address, and city; postal code and delivery notes are optional.
- The source does not implement stock deduction or a stock-quantity check in checkout. Treat stock reconciliation as an open product requirement, not a proven feature.
- `#/orders` currently renders the cart page. Use the staff order list and recorded order IDs to check persistence; a separate adopter order-history screen is not established by this route.

### Validation and files

- Signup passwords require 8–255 characters, including uppercase, lowercase, a digit, and a symbol, with matching confirmation.
- First and last names allow 1–80 characters. Pet names allow 1–120; age must be a nonnegative integer; weight must be nonnegative with at most two decimal places.
- Email changes are blocked on profile/user update endpoints. Check that the UI communicates this restriction.
- Image uploads allow JPEG, PNG, and WebP up to **5,242,880 bytes**. Medical documents allow PDF up to **10,485,760 bytes**. Extension, MIME type, and file signature are validated.
- Test file sizes through both native and proxied environments: a reverse proxy can reject an upload before application validation.

## 5. Smoke test — run first

Record results in [QA_TEST_CASES.csv](QA_TEST_CASES.csv). All cases initially have status **Not Run**. `P0` means core release gate; `P1` means main regression; `P2` means secondary coverage. These are test priorities, separate from defect severity.

| ID | Priority | Role / precondition | Steps | Expected result |
| --- | --- | --- | --- | --- |
| SM-01 | P0 | Visitor; environment running | Open home, pets, a pet detail, and system status; check `/ready` using the configured API base. | Pages render; API is reachable; readiness reports a healthy database. |
| SM-02 | P0 | One account per role | Log in separately as adopter, employee, vet, manager, and admin; open each dashboard and log out. | Each account reaches its own dashboard; logout returns to login. |
| SM-03 | P0 | Adopter A, employee; available pet A | Submit adoption request as A; approve it as employee; refresh A's requests and adoptions. | Request is approved, pet adopted, and exactly one adoption record is visible to A. |
| SM-04 | P0 | Adopter; active listed product | Add product to cart; supply delivery details; place cash order; inspect staff order list. | Success shows an order ID; matching completed cash order persists; cart is empty. |
| SM-05 | P0 | Vet; test pet | Add medical entry and vaccination; refresh both pages. | Both records persist against the correct pet. |
| SM-06 | P0 | Visitor and adopter | Open `#/admin-users`; call a protected admin API without a token, then with an adopter token. | Visitor is sent to login; adopter is redirected from forbidden UI; API refuses unauthorized access. |

If a smoke test fails, report it immediately and mark dependent tests Blocked. Continue independent areas that remain testable.

## 6. Detailed regression cases

For every mutation, refresh or sign in again to verify persistence. Record created entity IDs. Negative tests must also verify that no unintended record was created or changed. Semicolon-separated variations should each be checked and described in the result notes.

### Authentication and profile

| ID | Priority | Role / precondition | Steps | Expected result |
| --- | --- | --- | --- | --- |
| AUTH-01 | P0 | Visitor; unique email | Sign up with valid names, strong password, and matching confirmation; then log in. | An adopter account is created and can access the adopter dashboard. |
| AUTH-02 | P1 | Visitor | Submit blank required fields; malformed email; 7-character password; password missing each required character type; mismatched confirmation; overlength name. | Each invalid submission gives useful validation and creates no account. |
| AUTH-03 | P1 | Existing email | Attempt duplicate signup; log in with wrong password; log in as an inactive account. | Duplicate signup and invalid/inactive login are rejected without an authenticated session. |
| AUTH-04 | P0 | Authenticated user | Refresh a protected page; expire the access token using a controlled fixture; allow refresh; log out; revisit protected page and reuse old refresh token. | Session refresh works when valid; logout removes UI access and invalidates refresh-token reuse. |
| AUTH-05 | P1 | Controlled mailbox; mail configured | Request password reset; follow link; choose strong matching password; log in; reuse link; test expired/invalid token. | Valid reset works; old password fails; reused/expired/invalid token is rejected. Token lifetime in source is one hour. |
| AUTH-06 | P1 | Local-password account | Change password with wrong current password and mismatched confirmation, then valid values; log in with old and new passwords. | Invalid changes fail; only the new password works after success. |
| AUTH-07 | P1 | Google integration configured | Complete Google login; separately cancel consent and test callback failure. | Success establishes the correct account session; failures return a usable error state without a partial session. Mark Blocked if configuration is unavailable. |
| AUTH-08 | P1 | Each authenticated role | Edit allowed profile fields, refresh; try an email change via API; upload valid avatar. | Allowed changes and avatar persist; email update is refused. |

### Pets and adoption

| ID | Priority | Role / precondition | Steps | Expected result |
| --- | --- | --- | --- | --- |
| PET-01 | P1 | Visitor; multiple pets | Browse and search pets; combine available filters; change pages; clear filters; search nonexistent text. | Results and details agree; pagination works; empty results are clear and filters reset correctly. |
| PET-02 | P1 | Employee | Create pet with valid fields; edit description; upload image; refresh staff and public views. | Correct record and image persist; public information matches the saved pet. |
| PET-03 | P1 | Employee | Submit missing name/species; negative or fractional age; negative weight; invalid species; overlength description. | Invalid data is rejected and existing records remain unchanged. |
| PET-04 | P1 | Manager/admin; disposable pet | Cancel archive confirmation, then confirm archive; search again; open the previous detail URL. | Cancel preserves the pet; confirmed archive removes it from active lists; old URL handles unavailable data clearly. |
| ADP-01 | P0 | Adopter A; available pet | Submit request with notes; refresh My Requests and staff request list. | One pending request records the correct adopter, pet, and notes; pet becomes pending. |
| ADP-02 | P0 | Pending pet from ADP-01; adopter B | Repeat A's submission; submit as B; try an adopted pet and a medical-hold pet. | No additional request is accepted for unavailable pets; error is understandable. |
| ADP-03 | P0 | Employee/manager/admin; pending request | Approve once; repeat approval; inspect adopter history and public pet state. | Exactly one adoption is created; pet is adopted; repeated approval fails; adopter sees the outcome. |
| ADP-04 | P1 | Reviewer; separate pending request | Reject request; refresh adopter view and pet list. | Request is rejected; pet becomes available if no other pending request remains; adopter receives an update notification. |
| ADP-05 | P1 | Adopter; own pending request | Cancel request; attempt cancel again; separately attempt to cancel an approved request. | First cancellation succeeds and releases the pet if appropriate; later/invalid cancellation is rejected. |
| ADP-06 | P1 | Adopter; previously rejected/canceled request | Ensure pet is available; submit again; inspect ID, notes, status, reviewer, and date. | Request returns to pending with current details and cleared reviewer; reuse of the previous ID is acceptable. |
| ADP-07 | P0 | Two browser profiles; one available pet | Submit requests nearly simultaneously as two adopters; inspect persisted requests and pet state. | Only one submission succeeds; no duplicate active reservation or inconsistent pet state results. |
| ADP-08 | P1 | Prepared competing pending requests | Approve one competing request; inspect all requests for that pet. | Selected request is approved, others rejected, and only one adoption exists. |

### Medical records and vaccinations

| ID | Priority | Role / precondition | Steps | Expected result |
| --- | --- | --- | --- | --- |
| MED-01 | P1 | Vet; pet with record | Create, edit, and delete a medical entry; check another pet; refresh after each action. | Changes persist only for the intended pet; removed entry no longer appears in active results. |
| MED-02 | P1 | Vet | Add vaccination with valid date and optional batch/due date/notes; edit it; delete it. | Correct fields persist and deletion updates the pet's vaccination list. |
| MED-03 | P1 | Vet | Submit missing vaccine name/date; malformed date; invalid status; overlength notes. | Invalid data is rejected with a useful error; no partial vaccination appears. |
| MED-04 | P1 | Vet; valid PDF | Upload medical document; reopen record; download document; inspect another pet's record. | PDF remains linked to the intended medical record and downloads intact. |

### Inventory, shopping, and orders

| ID | Priority | Role / precondition | Steps | Expected result |
| --- | --- | --- | --- | --- |
| INV-01 | P1 | Employee/manager/admin | Create supplier and supply; edit supported fields; upload supply image; refresh lists. | Values and relationships persist; image displays correctly. |
| INV-02 | P1 | Employee; supply and product | List an active positive-stock supply in store; view as adopter; unlist it; test zero stock. | Store shows eligible listings and excludes unlisted/zero-stock items. |
| INV-03 | P1 | Inventory user | Test search, category/status filters, low-stock list, pagination, and empty results. | Displayed records match filters and quantities; paging does not lose the filter state. |
| INV-04 | P1 | Manager/admin; disposable fixtures | Cancel deletion, then delete a supply/supplier where allowed; retry linked supplier deletion. | Cancel preserves data; permitted deletion persists; linked-record restrictions produce a clear error without broken relationships. |
| SHOP-01 | P1 | Adopter; listed product | Add product twice; change quantity; refresh; remove item; clear cart. | Cart combines quantities for the same product, computes totals correctly, persists changes, and clears successfully. |
| SHOP-02 | P1 | Adopter; API client | Send zero, negative, fractional, and nonnumeric cart quantities; test unknown product ID; submit an empty-cart checkout. | Invalid requests fail without creating an order or corrupting cart quantities. |
| SHOP-03 | P0 | Adopter; cart with two products | Calculate expected total; enter delivery details; place cash order; inspect staff order list and payment. | Stored total matches database prices; delivery data is correct; order is completed with one cash payment; cart clears. |
| SHOP-04 | P1 | Adopter; nonempty cart | Omit each required delivery field; submit whitespace-only fields through UI; test field maximum lengths via API. | Validation prevents invalid checkout; optional postal code/notes may be omitted. |
| SHOP-05 | P1 | Adopter; API client; cart | Call create checkout only; inspect pending order; cancel it; try paying canceled order. | Pending order has no payment and cart is intact; cancellation persists; canceled order cannot be paid. |
| SHOP-06 | P0 | Adopter; pending order | Pay once; send repeated/concurrent pay requests for the same order ID. | Exactly one payment is recorded and order completes once; repeats fail cleanly. |
| SHOP-07 | P1 | Adopter; controlled network failure | Allow create checkout but fail the pay request; restore network; inspect order list before retrying. | Error is visible; no false success; record pending/duplicate orders and whether retry recovers. See open risk G-06. |
| SHOP-08 | P1 | Disposable stock fixture | Add quantity above stock; purchase; compare inventory before/after; change cart after creating a pending order, then pay. | Record observed stock/cart behavior for product decision under G-05/G-06; do not mark stock management passed without agreed requirements. |
| ORD-01 | P1 | Employee/manager/admin | Open orders; search/filter using available controls; inspect completed, pending, and canceled fixtures. | Correct customer, line items, totals, payment, and status appear; no unsupported shipping status is assumed. |

### Administration, reports, and notifications

| ID | Priority | Role / precondition | Steps | Expected result |
| --- | --- | --- | --- | --- |
| ADM-01 | P1 | Admin; disposable department | Create manager/employee/vet account with required employee fields; edit allowed fields; deactivate disposable account; try login. | Staff record and role persist; inactive account cannot authenticate. |
| ADM-02 | P0 | Manager and admin | As manager try editing admin/peer manager and assigning roles; as admin try changing another admin and removing last active admin. | Hierarchy and last-active-admin protections reject disallowed operations. |
| ADM-03 | P1 | Admin | Create/edit department; assign and remove staff; try duplicate name and deletion with assigned staff. | Valid changes persist; duplicates and unsafe operations are handled without orphaned staff records. |
| ADM-04 | P2 | Admin | Open Roles; change checkboxes and save; leave and return; inspect network activity. | Document current nonpersistent behavior as G-01; do not certify editable permissions. |
| ADM-05 | P1 | Admin | Open Files with mocks disabled; inspect list request; attempt search/download if loading succeeds. | Document G-03 if list endpoint is unavailable; file upload testing remains independent. |
| REP-01 | P1 | Each permitted report role | Set available report filters; compare known fixtures; download CSV and PDF; open files. | Counts, filters, columns, dates, and downloaded content agree; no corrupt/empty export when matching data exists. |
| REP-02 | P1 | Manager/admin | Compare dashboard/analytics totals to a controlled fixture set; change supported time filters; inspect no-data range. | Values reconcile with the selected scope; charts and empty states are usable. |
| REP-03 | P2 | Admin; recent user action | Create a tracked action; reopen Activity; search it; open details; apply role/severity filters. | Recent action appears where returned; record placeholder role/IP/severity and limited history under G-04. |
| NOT-01 | P1 | Adopter; adoption decision | Trigger approval/rejection; open notifications; mark one read, then all read; refresh. | Correct user's notifications persist; unread count matches read state. |
| CHAT-01 | P1 | Adopter and employee | Open chat lists/detail; attempt send/read/update where possible with mocks disabled. | Capture missing-endpoint failures under G-02; dependent conversation tests are Blocked until integration exists. |
| CHAT-02 | P2 | Manager/admin | Open chat screens and inspect send/status controls. | Screens are read-only; end-to-end access/data testing depends on resolving G-02. |

### Access control and uploads

| ID | Priority | Role / precondition | Steps | Expected result |
| --- | --- | --- | --- | --- |
| SEC-01 | P0 | Adopters A and B; A's request/order/notification IDs | As B, read/cancel A's request, pay/cancel A's order, and mark A's notification read using direct API requests. | Requests are refused or inaccessible; A's data and state remain unchanged. |
| SEC-02 | P0 | Each role; test fixtures | Exercise forbidden actions from section 3 directly by API, including employee archive/delete and admin medical writes. | Backend enforces action-specific role restrictions independently of UI visibility. |
| SEC-03 | P0 | Visitor; valid IDs | Request protected profile, cart, report, and medical-document endpoints without authentication; repeat with invalid token. | Private data is inaccessible and no mutation succeeds. |
| SEC-04 | P1 | Authenticated user; API client | Add unexpected fields such as role assignment to signup/profile payloads; submit malformed IDs and missing required fields. | Invalid/unauthorized fields are rejected; no privilege escalation; errors do not expose server stack traces. |
| FILE-01 | P1 | Roles allowed for each upload category | Upload JPEG/PNG/WebP and PDF in correct categories; test just below/above limits; wrong extension/type; renamed text fixture. | Valid files persist; unsupported, oversized, or signature-mismatched files are rejected; no broken record remains. |
| FILE-02 | P0 | Private medical PDF; visitor/adopter/staff profiles | Try protected file URL and any returned or known static upload URL as unauthorized users; try another user's file deletion. | Private documents and unauthorized deletion are denied through every reachable URL. Static serving warrants explicit verification. |

## 7. Usability and reliability coverage

Suggested browser coverage: desktop Chrome and Firefox, plus Safari where available; a mobile browser on Android or iOS. Record actual browser/OS versions. Suggested viewport sizes: 360×800, 768×1024, and 1440×900.

| ID | Priority | Role / precondition | Steps | Expected result |
| --- | --- | --- | --- | --- |
| UX-01 | P1 | Desktop, tablet, mobile sizes | Repeat login, pet browsing, request submission, and cart; inspect sidebar, dialogs, tables, and forms. | Controls remain visible and usable; text is readable; no blocked actions from overflow or overlays. |
| UX-02 | P1 | Any role | Switch English/Arabic; inspect RTL layout, dates, amounts, validation, dialogs, and navigation; change theme if offered. | Language/direction are consistent, no raw translation keys appear, and controls remain legible. |
| UX-03 | P1 | Keyboard-only interaction | Navigate forms/dialogs with Tab/Shift+Tab; activate controls; close dialogs; inspect focus and input labels. | Focus is visible and usable; controls have meaningful labels; modal interaction does not trap users incorrectly. |
| UX-04 | P1 | Authenticated user | Refresh hash detail URL; use browser Back/Forward; open missing pet ID; revisit a restricted route after logout. | Navigation preserves the correct record where applicable; missing data and authentication failures are handled clearly. |
| UX-05 | P1 | Controlled offline/slow network | Load lists and submit a form during failure; restore connection; retry. | Loading ends appropriately; errors are visible; inputs are preserved where practical; no false success or duplicate mutation. |

Record response times for pet browsing, login, adoption submission, and checkout using the same network and dataset. There is no agreed performance threshold in this handoff; obtain an acceptance target before using timing as a release gate.

## 8. Source-observed limitations and open decisions

These are observations from this checkout, **not reproduced runtime defects**. Verify against the deployed build and create/link tickets. A listed gap is not an automatic release waiver.

| Ref | Observation and evidence | QA handling |
| --- | --- | --- |
| G-01 | `Frontend/src/pages/admin/AdminRolesPage.tsx` uses a fixed role/permission list. Save closes the dialog without persisting changes; add-role control has no handler. | Treat role editing as incomplete. Test actual API guards using the fixed roles, not the permissions displayed here. |
| G-02 | Chat pages call `/messages/conversations`, conversation detail/read/update, and `/messages/send`. No matching messaging controller/module is present or registered in `Backend/src/app.module.ts`. | Verify failures in live mode; mark dependent chat workflows blocked. Mock results are insufficient. |
| G-03 | `AdminFilesPage.tsx` calls `GET /files`; `uploads.controller.ts` defines only file-by-ID retrieval and deletion. | Verify admin list failure; continue individual upload/retrieval tests separately. |
| G-04 | `ActivityLogPage.tsx` uses recent dashboard activity, supplies `-` for role/IP, and sets all severities to `info`. | Do not certify full audit history or meaningful role/severity filtering. |
| G-05 | Cart/checkout services do not enforce stock quantities or deduct inventory on payment. Checkout controller has JWT guards without an adopter role guard. | Confirm intended stock and role rules with the product owner; test direct APIs and document the gap. |
| G-06 | Cart creates an order then pays in a separate request. Checkout creation has no duplicate-order check; payment clears the user's entire current cart. | Test failure between calls, retries, and cart edits between create/pay; report duplicate/pending orders or unintended cart removal. |
| G-07 | `Backend/src/main.ts` currently serves `/uploads/` statically in addition to protected `/files/:fileId`. | Verify private document access through direct/static URLs. A confirmed unauthorized disclosure is a release blocker. |
| G-08 | `#/orders` maps to `CartPage`, and adoption cancellation spellings differ across source definitions. | Confirm order-history scope and cancellation labels/filter behavior. |
| G-09 | `Frontend/nginx.conf` does not set `client_max_body_size`, while the backend permits images up to 5 MiB and PDFs up to 10 MiB. | Verify deployed proxy upload limits; record proxy-level failures separately from application validation. |

Email delivery, Google OAuth, monitoring, and backup/restore require environment configuration. Mark unavailable integrations Blocked, with owner and reason. This plan covers application QA; infrastructure recovery testing and production load testing need separately agreed procedures.

## 9. API reference for targeted checks

Prefix these paths with the actual API base from section 2. Protected calls use `Authorization: Bearer <accessToken>`. Obtain tokens through your QA account; redact them from evidence.

| Area | Representative methods and paths |
| --- | --- |
| Health | `GET /health`, `GET /ready`, `GET /version` |
| Auth | `POST /auth/signup`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/change-password`, `/auth/forgot-password`, `/auth/reset-password` |
| Profile | `GET/PATCH /users/profile`, `POST /users/profile/avatar` |
| Pets | `GET/POST /pets`, `GET/PATCH/DELETE /pets/:id`, `POST /pets/:petId/images` |
| Adoption | `GET/POST /adoption/requests`, `GET /adoption/requests/:requestId`, `PATCH /adoption/requests/:requestId/cancel`, `POST /adoption/requests/:requestId/approve`, `POST /adoption/requests/:requestId/reject`, `GET /adoption/adoptions` |
| Medical | `GET /pets/:petId/medical-record`, `POST /pets/:petId/medical-record/entries`, `POST /pets/:petId/medical-record/documents`, `PATCH/DELETE /medical-entries/:entryId` |
| Vaccinations | `GET/POST /pets/:petId/vaccinations`, `PATCH/DELETE /vaccinations/:vaccinationId` |
| Inventory | `GET/POST /inventory/supplies`, `PATCH/DELETE /inventory/supplies/:id`, `GET/POST /inventory/suppliers` |
| Store/cart | `GET /store/supplies`, `GET/DELETE /cart/me`, `POST /cart/items`, `PATCH/DELETE /cart/items/:productId` |
| Checkout/orders | `POST /checkout`, `POST /checkout/:orderId/pay`, `POST /checkout/:orderId/cancel`, `GET /orders` for permitted staff |
| Notifications | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:notificationId/read`, `PATCH /notifications/read-all` |
| Files | `GET/DELETE /files/:fileId`; no collection list endpoint in this checkout |
| Reports | `GET /reports/adoptions`, `/reports/inventory`, `/reports/pets`; append `/export/csv` or `/export/pdf` for export |

Common expected error classes: 400 invalid input/state, 401 missing/invalid authentication, 403 insufficient permissions, 404 missing/inaccessible resource, and 409 duplicate/conflict. Ownership checks may use either 403 or 404 depending on the endpoint; verify that access is denied and no data changes.

## 10. Reporting and completion

Use [QA_TEST_CASES.csv](QA_TEST_CASES.csv) in Excel, Google Sheets, or another spreadsheet tool. Set each case to **Pass**, **Fail**, **Blocked**, or **Not Run**. Enter actual result, defect/evidence link, tested build/environment, tester, and date. For grouped variations, record which variations passed or failed.

### Bug report template

```text
Title: [Area] Short description of the problem
Case ID / known-gap reference:
Build / commit:
Environment URL:
Browser version / OS / viewport / language:
Role and synthetic record IDs:
Preconditions:
Steps to reproduce:
1.
2.
3.
Expected result:
Actual result:
Reproducibility: every time / intermittent (count)
Severity: Critical / High / Medium / Low
Evidence: screenshot/video, timestamp, redacted request/response
Related ticket / workaround:
```

Severity guidance: **Critical** = unauthorized sensitive-data access, broad outage, or major data corruption; **High** = core adoption/login/checkout blocked or incorrect with no reasonable workaround; **Medium** = functional issue with a workaround or limited impact; **Low** = cosmetic/copy issue without functional impact. Set fix priority separately with the product owner.

Suggested completion criteria:

- All P0 cases pass; no open Critical or High defects.
- All in-scope P1 cases are executed; remaining defects and blocked cases have explicit product-owner disposition.
- Source-observed gaps are reproduced or ruled out on the deployed build; incomplete features are explicitly excluded or fixed before sign-off.
- Fixes are retested, and affected core workflows are rerun.
- QA summary records case counts, browser coverage, build, outstanding tickets, and release recommendation.

```text
QA summary
Build / environment:
Testing dates / tester:
Pass: __  Fail: __  Blocked: __  Not Run: __
Open defects by severity:
Excluded features / accepted limitations and approver:
Retest results:
Recommendation: Ready / Ready with accepted limitations / Not ready
QA reviewer / product owner / date:
```

## 11. Source references for maintainers

- Navigation and page roles: `Frontend/src/app/App.tsx`.
- Setup and scripts: `docker-compose.yml`, `Frontend/nginx.conf`, workspace `package.json` files, `.env.example`, and `Frontend/.env.example`.
- Adoption state transitions: `Backend/src/modules/adoptions/adoptions.service.ts`.
- Checkout behavior: `Frontend/src/pages/CartPage.tsx` and `Backend/src/modules/checkout/checkout.service.ts`.
- Permissions: feature controllers under `Backend/src/modules/` and user authorization in `users.service.ts`.
- Validation: `shared/dto/`, `shared/validators/`, and `shared/constants/uploads.constants.ts`.

Refresh this handoff when the deployed build, permissions, checkout flow, or known limitations change.
