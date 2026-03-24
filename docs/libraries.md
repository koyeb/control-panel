# Libraries & Tools

## Build & Development

- **Vite** — Build tool and dev server with manual chunk splitting and API proxy (`vite.config.ts`)
- **TypeScript** — Strict mode, path alias `src/*`, config in `tsconfig.json`
- **pnpm** — Package manager (v10)
- **ESLint** — Flat config with plugins for React, React Hooks, TanStack Query, and Tailwind CSS (`eslint.config.js`)
- **Prettier** — Code formatter with `@trivago/prettier-plugin-sort-imports` for import sorting

## Framework & Routing

- **React** — v19 SPA rendered into `#root`, entry point `src/main.tsx`
- **TanStack Router** — File-based type-safe routing in `src/routes/`, auto-generates route tree, supports Zod search param validation and typed route context
- **TanStack React Query** — Server state management with typed `apiQuery()` / `apiMutation()` helpers, automatic caching, deduplication, and invalidation (`src/api/query.ts`)

## Styling

- **Tailwind CSS** — v4 atomic CSS via `@tailwindcss/vite`, entry point `src/styles.css`, with `@tailwindcss/typography` and `eslint-plugin-better-tailwindcss`
- **@koyeb/design-system** — Internal component library built on Radix UI Themes
- **Lucide React** — SVG icon library, selectively imported per component
- **class-variance-authority** — Variant-based component styles, used alongside `clsx` for conditional class merging

## Forms & Validation

- **React Hook Form** — Form state management with project wrappers in `src/hooks/form.ts` (`handleSubmit`, `useFormErrorHandler`, `useFormValues`)
- **Zod** — Runtime validation with i18n error messages (`src/application/validation.ts`), used for route search params, form validation via `@hookform/resolvers`, and type guards

## Data Fetching & API

- **openapi-typescript** — Generates TypeScript types from the Koyeb OpenAPI spec to `src/api/api.generated.d.ts` (`pnpm api-codegen`)

## Authentication & Payments

- **WorkOS AuthKit** — SSO and MFA authentication, wraps app in `AuthKitProvider` and auto-injects access tokens into API requests (`src/application/authkit.tsx`)
- **Stripe** — Payment forms via `@stripe/react-stripe-js` with lazy-loaded `StripeProvider` and retry logic (`src/application/stripe.tsx`)

## Analytics & Monitoring

- **PostHog** — Product analytics with manual pageview tracking and `useTrackEvent()` hook (`src/application/posthog.tsx`)
- **Sentry** — Error tracking with session replay, source map uploads via `@sentry/vite-plugin`, filters expected errors (`src/application/sentry.ts`)
- **Intercom** — Customer support chat widget (`src/side-effects.ts`)

## UI Components & Visualization

- **Nivo** — Line and bar charts (`@nivo/line`, `@nivo/bar`) for service metrics dashboards (`src/modules/metrics/`)
- **CodeMirror** — Code editor via `@uiw/react-codemirror` with GitHub themes and language extensions (`src/components/code-editor/`)
- **xterm.js** — Terminal emulator via `@xterm/xterm` for interactive service console (`src/components/terminal/`)
- **Downshift** — Accessible select and combobox primitives for custom dropdowns (`src/components/forms/`)
- **Motion** — Animation library (Framer Motion) for drawer overlays and transitions using `AnimatePresence`
- **Mapbox** — Street address autocompletion via `@mapbox/search-js-core` for billing forms

## Utilities

- **date-fns** — Date/time formatting, relative times, and date arithmetic
- **lodash-es** — General-purpose utility functions (ES module build)
- **clsx** — Conditional CSS class string builder
- **query-string** — URL query string parsing and stringification
- **jwt-decode** — Decodes JWT tokens for session handling
- **tldts** — Top-level domain parsing to extract domain parts from URLs
- **unique-names-generator** — Random human-readable name generation for services
- **dequal** — Deep equality comparison for memoization and change detection
- **diff** — Text diffing to show configuration or deployment differences
- **unified / remark / rehype** — Markdown pipeline: parse, convert to HTML, syntax highlight, sanitize, render as React (`remark-gfm` for GFM support)
- **Shiki** — Syntax highlighter for code snippets with accurate language grammars
- **ansi_up** — Converts ANSI escape codes to HTML for colored build/deployment logs

## Testing

- **Vitest** — Unit and component tests with `happy-dom`, tests live in `src/` (`pnpm test`)
- **@testing-library/react** — React component testing utilities (`render`, `screen`, `fireEvent`, `waitFor`)
- **Playwright** — End-to-end browser tests in `tests/` with parallel workers and CI retries (`pnpm e2e`)

## Developer Tools

- **Storybook** — Component development environment (v10) with dark mode (`pnpm storybook`)
- **TanStack Devtools** — In-browser dev tools for inspecting route state and query cache
- **vite-plugin-svgr** — Transforms SVG files into React components at build time
- **vite-tsconfig-paths** — Resolves TypeScript path aliases in Vite (`src/*` imports)
