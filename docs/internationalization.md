# Languages and right-to-left layout

Petopia provides English (`en`), Arabic (`ar`) and French (`fr`). These address two
separate minor modules in the supplied ft_transcendence subject: three languages
(1 point) and RTL support (1 point). The related [custom design system](design-system.md)
is a third minor module. These are module claims to demonstrate, not a guaranteed
assessment score.

## Implementation

- `Frontend/src/i18n/translations.ts`: matching English, Arabic and French keys,
  including complete French copy rather than generated labels.
- `interfaceText.ts`, `text.ts` and `useText.ts`: translated interface copy and
  named interpolation for counts, names, validation and operation messages.
- `notifications.ts` and `activity.ts`: localize known notification templates and
  audit enums at the display boundary without changing API identifiers.
- `LanguageContext.tsx`: reactive translation functions, per-user session choice,
  HTML `lang`/`dir`, body direction and Radix direction context for portal controls.
- `LanguageSwitcher.tsx`: native keyboard-accessible selector in public and
  authenticated headers. Settings also exposes language selection.

The UI covers public/authentication/legal pages, all five role dashboards,
Community, Friends, direct/support chats, status checks, file previews, upload
progress, medical PDF imports, bulk deletion and validation messages. API errors
use translated messages where known and localized status-specific fallbacks.
Names, filenames, addresses, pet descriptions and chat messages are user data and
retain their original content. Technical PDF import examples and API identifiers
retain the syntax required by the parser. New interface copy must be entered in
all three dictionaries; never translate route names, enum comparisons or payloads.

## RTL behavior

Arabic updates document direction without reloading. Logical start/end margins,
padding, positioning, borders, alignment and corner radii mirror navigation,
sidebars, drawers, search icons, tables and cards. Mobile sidebars enter from the
right in Arabic and from the left in English/French. Back/next icons mirror;
photos, logos and status icons retain their orientation. Chart time axes retain
LTR order while labels translate. Arabic uses Cairo. Email, password, URL,
telephone and numeric inputs retain LTR entry, including revealed passwords.

## Automated checks

From the repository root:

```sh
node --test Frontend/tests/i18n.test.mjs
npm run build -w pet-adoption-frontend
VITE_USE_MOCKS=false VITE_API_BASE_URL=/api npm run dev -w pet-adoption-frontend -- --host 127.0.0.1 --port 5175
```

With that dev server running, in another terminal:

```sh
node Frontend/tests/i18n.browser.mjs
node Frontend/tests/i18n-interactions.browser.mjs
CHROME_PATH=/usr/bin/google-chrome node Frontend/test/data-transfer.test.cjs
node Frontend/test/file-management.test.cjs
```

The unit audit checks dictionary key parity, nonempty values, matching named
parameters, static JSX labels and static translation-key references. The browser
matrix exercises 54 representative routes in three languages at 390 px and
1440 px, checks rendering, JavaScript errors, horizontal document overflow and
desktop sidebar mirroring. The interaction suite verifies live switching without losing form values, session
persistence, LTR credentials, mobile sidebar edges, translated import validation
and the direction of a portaled menu. API responses are deterministic fixtures; these tests
do not certify production connectivity or translate arbitrary user content.
`UI_TEST_URL` and `CHROME_PATH` can override the server and Chromium executable.

## Evaluation demonstration

1. On the public home page select each of English, Arabic and French. Open the pet
   catalog, shop, privacy, terms and status pages. Check both labels and paragraphs.
2. On login, enter an email/password, switch to Arabic and back to French, and
   verify values stay intact and entry direction remains LTR.
3. Sign in with each role. Switch language and check dashboard navigation, table
   columns, forms, filters, pagination, confirmations and empty/error states.
4. On a 390 px viewport open the sidebar: right edge for Arabic, left edge for
   English/French. Open a dialog and verify close controls, focus and text direction.
5. In Community/Friends/chat check search, requests, moderation, empty states and
   profile dialogs. User-authored messages and names should remain unchanged.
6. As a vet, open medical PDF import, reject an invalid file, upload a valid PDF,
   inspect partial errors, and open bulk deletion confirmation in each language.
7. As an admin, open files, preview an image/PDF, review upload progress and delete
   a permitted document. Confirm translated actions and dialog placement.
8. Reload after choosing a language; verify that user's session choice is restored.
   Switch back to English and confirm that sidebar and directional icons return.

Production containers need a frontend rebuild to serve source changes.

## Verification result (2026-09-25)

- Production frontend build: passed.
- Dictionary/interpolation/static-label tests: 3 passed.
- Browser matrix: 324 route/language/viewport checks passed (54 × 3 × 2).
- Language-switching and RTL interaction suite: passed.
- Existing import/bulk-delete, file-preview and real upload-progress regressions: passed.
- `git diff --check`: passed.
- Full frontend TypeScript checking still reports 543 pre-existing diagnostics,
  primarily shared DTO decorator configuration and mock typing. Comparing diagnostics
  by file/message against the baseline found no additional errors from this work.
