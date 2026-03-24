# Styles

## Overview

Styling is done with **Tailwind CSS v4** using utility classes directly in JSX. The Tailwind configuration (theme, colors, spacing, etc.) lives in the `@koyeb/design-system` package ([github.com/koyeb/design-system](https://github.com/koyeb/design-system)), published on npm. The control panel imports it in `src/styles.css`:

```css
@import 'tailwindcss';
@import '@koyeb/design-system/styles.css';
@source "../node_modules/@koyeb/design-system";
```

**Note:** Radix UI (`@radix-ui/themes`) is only installed because it's a peer dependency of WorkOS. It is not used directly.

## CSS Utilities

- **clsx** — Conditionally joins class names. Used extensively in components for dynamic styling.
- **cva** (class-variance-authority) — Defines component variants as a map of class names. Used for components that need multiple visual states (e.g., layout variants).

```tsx
// clsx example
<div className={clsx('rounded-full border p-1.5', { 'bg-green': isActive })} />;

// cva example
const styles = cva('flex gap-2', {
  variants: {
    size: { sm: 'text-sm', md: 'text-base' },
  },
});
```

## Project-Level Customizations (`src/styles.css`)

- Adds a `3xl` breakpoint at 1920px and a custom `purple` color
- Base layer: dark mode background, focus ring styles, number input arrow removal, prose overrides for markdown content
- Custom `text-security-disc` utility for password-style masking
- React-toastify theme overrides (transparent background, custom width, animation)
- Intercom z-index override and reCAPTCHA badge hiding

## Linting

The `eslint-plugin-better-tailwindcss` ESLint plugin enforces consistent class ordering. The entry point is configured as `src/styles.css`.

## z-index

- 10: header
- 20: banner
- 30: menu
- 40: full-screen elements
- 50: floating (dropdown, tooltips, menus)
- 60: toasts
