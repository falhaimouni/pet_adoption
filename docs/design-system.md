# Petopia design system

Petopia uses a custom application component layer over React, Tailwind, Lucide and
selected Radix primitives. The custom layer defines the shelter application's
cards, forms, status badges, navigation, file workflows, spacing and responsive
behavior. Radix supplies interaction primitives; Lucide supplies icon artwork.
Neither library is claimed as original work.

This implements the subject's **custom design system minor module (1 point)**.
The following components are application-owned and used by real screens, rather
than an unused component collection.

## Color tokens

Tokens live in `Frontend/src/styles/theme.css`. Tailwind exposes them through
`@theme inline`; reusable components use `bg-primary`, `text-primary`,
`text-primary-hover`, `bg-secondary`, `text-foreground` and related utilities.
Dark mode overrides surface/text tokens. Use semantic tokens for new shared UI.

| Token | Light value | Purpose |
| --- | --- | --- |
| primary | `#089D97` | Primary actions and brand accents |
| primary-hover | `#047975` | Hover emphasis and strong brand text |
| background | `#f0f8f7` | Page surface |
| card | `#ffffff` | Cards and dialogs |
| foreground | `#1a2e2d` | Primary text |
| secondary | `#e0f2f0` | Selected navigation and soft accents |
| muted-foreground | `#5a8a87` | Supporting text |
| success | `#15803d` | Successful operations |
| warning | `#b45309` | Attention and pending actions |
| destructive | `#d4183d` | Destructive actions and errors |
| info | `#2563eb` | Informational states |

Status badges pair text with color; never convey meaning by color alone.
Charts use distinct categorical palettes, with translated legends and labels.

## Typography, spacing and icons

- Body/interface: Poppins, with Inter/sans-serif fallbacks. Base size: 16 px.
- Editorial headings: Prata; operational headings use semibold Poppins.
- Arabic: Cairo replaces the Latin interface fonts. Do not shrink Arabic text to
  compensate for longer labels; allow wrapping and adequate line height.
- Component hierarchy: 11–12 px supporting labels, 13–16 px controls/body,
  16–20 px card/dialog headings, 24–28 px metrics, 30–48 px page/hero headings.
- Spacing uses Tailwind's 4 px scale: 8/12/16/20/24 px for gaps and padding.
- Corner tokens: controls 10 px, cards 15 px, dialogs 20 px; badges use pills.
- Lucide is the primary icon set: 14–16 px compact controls, 20–24 px navigation
  and actions, 28 px empty-state illustrations. Use consistent stroke weight.
- Icon-only actions require a translated accessible label. Decorative artwork
  should have empty alternative text or `aria-hidden`. Meaningful photos retain
  user/pet names or translated descriptions.
- Back/next arrows mirror in RTL. Photos, logos, status symbols and chart time
  axes do not mirror. Prefer logical start/end layout utilities.

## Reusable component catalog

Paths below are relative to `Frontend/src/components/`.

| Custom component | Contract / variants | Production usage |
| --- | --- | --- |
| `Navbar.tsx` | Public/authenticated navigation, responsive menu, notifications, language/theme controls | Home, catalog, profile, legal and status pages |
| `DashboardLayout.tsx` | Five role configurations, breadcrumbs, responsive sidebar, support entry | All role dashboards and management screens |
| `InputField.tsx` | Default/light, responsive mode, required/read-only, password visibility | Login and signup |
| `Modal.tsx` | sm/md/lg, optional confirm action, destructive/disabled confirmation | Pet/user/department editors and deletion confirmation |
| `Badge.tsx` | success, pending, rejected, info, warning, neutral, teal; sm/md | User, inventory, adoption and medical tables |
| `Pagination.tsx` | Page count, previous/next, ellipsis, current-page semantics | Catalog and management lists |
| `PetCard.tsx` | Pet photo/loading/fallback, translated species/status, details/adopt actions | Pet catalog |
| `ProductCard.tsx` | Stock/discount badges, image fallback, add-to-cart and quick view | Shop |
| `KpiCard.tsx` | Metric, optional trend, icon and accent | Admin, manager, staff, vet and adopter dashboards |
| `EmptyState.tsx` | Icon, title, optional description/action | Empty search results, chats, files and tables |
| `BackHomeButton.tsx` | Responsive return navigation | Authentication screens |
| `AuthenticatedImage.tsx` | Protected/public image resolution and fallback | Profiles, pets, chats and navigation |
| `FilePreview.tsx` | Protected image/PDF dialog, loading/error states, thumbnail | Admin files and veterinary documents |
| `UploadProgress.tsx` | Concurrent transfers, determinate/indeterminate progress, processing state | Shared application shell |
| `MedicalDataImport.tsx` | PDF selection, validation, busy state, partial import results | Veterinary medical records |
| `BulkDocumentDelete.tsx` | Capped multi-select, confirmation, partial failure retention | Veterinary documents and admin files |
| `LanguageSwitcher.tsx` | English/Arabic/French, native language names, keyboard selection | Navbar and dashboard header |

## Usage examples

```tsx
<Badge label="pending" variant="pending" />
<Pagination page={page} totalPages={totalPages} onPage={setPage} />
<EmptyState title={t('files_empty_title')} description={t('files_empty_desc')} />
<KpiCard label={t('kpi_total_pets')} value={count} icon={<PawPrint size={20} />} />
```

Pass translated interface labels into components. Keep stored enum values,
resource IDs, user messages, names and uploaded filenames separate from display
labels. Use `t(key)` for the main catalog and `useText()` for source-text entries.

## Review checklist

Check default, hover, focus, disabled, loading, error and empty states where each
component supports them. Review at 390 px and 1440 px widths in English, Arabic
and French. Use the language selector without reloading: forms must retain their
values and navigation must continue to work. Check the sidebar, controls,
dropdowns, dialogs and pagination after both LTR → RTL and RTL → LTR transitions.

See [internationalization verification](internationalization.md) for automated
coverage and manual demonstration steps. This module does not claim complete
WCAG 2.1 AA compliance or authorship of the third-party primitives/icons.
