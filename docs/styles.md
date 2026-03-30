# Styles

## Overview

Styling is done with **Tailwind CSS** using utility classes directly in JSX. The Tailwind configuration (theme, colors, spacing, etc.) lives in the `@koyeb/design-system` package ([github.com/koyeb/design-system](https://github.com/koyeb/design-system)), published on npmjs. The control panel imports it in `src/styles.css`:

```css
@import 'tailwindcss';
@import '@koyeb/design-system/styles.css';
@source "../node_modules/@koyeb/design-system";
```

Tailwind is integrated via `@tailwindcss/vite` (see `vite.config.ts`). The `@tailwindcss/typography` plugin is also included for prose styling.

**Note:** Radix UI (`@radix-ui/themes`) is only installed because it's a peer dependency of WorkOS. It is not used directly.

## CSS Utilities

- **clsx** — Conditionally joins class names. Used extensively in components for dynamic styling.
- **cva** (class-variance-authority) — Defines component variants as a map of class names. Used for components that need multiple visual states.

```tsx
// clsx example
<div className={clsx('rounded-full border p-1.5', { 'bg-green': isActive })} />;

// cva example
const styles = cva('flex gap-2', {
  variants: {
    size: { sm: 'text-sm', md: 'text-base' },
  },
});

<div className={styles({ size: 'sm' })} />;
```

## Design System

The `@koyeb/design-system` package provides the Tailwind theme configuration (colors, spacing, fonts, etc.) and reusable components (`Button`, `Badge`, `Table`, `Alert`, etc.).

It also provides layout utility classes like `row` and `col` (flex), as well as semantic color utilities like `text-dim` for dimmed text.

## Dark Mode

The app supports `light`, `dark`, and `system` themes. Theme preference is stored in localStorage and applied as a class on `document.documentElement`. The `system` mode resolves to the user's OS preference.

The `index.html` reads `koyeb.theme` from the local storage in a blocking `<script>` to apply the theme class before React mounts, preventing a flash of incorrect styling.

The `neutral` and `inverted` colors represent the default background and foreground colors of the current theme. Use Tailwind's `dark:` variant for dark mode styling:

```tsx
<div className="bg-black dark:bg-white" />
```

## Responsive Design

Standard Tailwind responsive prefixes are available: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px). A custom `3xl` breakpoint at 1920px is defined in `src/styles.css`.

Cntainer queries are used for content-aware sizing. Use `@` prefixed variants for container query breakpoints (e.g., `@2xl:grid-cols-4`).

The `useBreakpoint` hook from the design system can be used for JS-level responsive logic, when pure CSS is not possible:

```tsx
const isMobile = !useBreakpoint('sm');
```

## Project-Level Customizations

Custom CSS lives in `src/styles.css`. Keep customizations minimal to maintain simplicity. This file also overrides styles for third-party tools like `react-toastify`.

The `body` has `overflow: scroll` to always show the scrollbar and avoid layout shifts when page height changes (e.g., expanding a collapsed section).

## Linting

The project uses `eslint-plugin-better-tailwindcss` for Tailwind class ordering and consistency checking. The entry point is configured to `src/styles.css` so the plugin understands the theme.

## z-index

- 10: header
- 20: banner
- 30: menu
- 40: full-screen elements
- 50: floating (dropdown, tooltips, menus)
- 60: toasts
