# Petopia interface guidelines

Use the application-owned components in `src/components` before adding new UI.
The catalog, tokens, typography, variants and examples are documented in
[the design system](../../docs/design-system.md).

- Use semantic color tokens from `src/styles/theme.css` for shared components.
- Provide English, Arabic and French copy for every new interface string.
- Use `useLanguage().t(key)` or `useText()`; translate labels, never stored enum
  values, identifiers or user-authored content.
- Use logical start/end positioning, spacing, borders and corner utilities.
  Keep physical centering (`left-1/2` plus negative half translation) when needed.
- Label icon-only buttons and expose loading/errors to assistive technology.
- Preserve validation, permissions and existing user input when changing language.
- Test desktop/mobile and LTR/RTL layouts before claiming a screen is complete.
