# Libraries & Tools

## Build & Development

- **pnpm** — Package manager
- **Vite** — Build tool and dev server (`vite.config.ts`)
- **TypeScript** — Strict type checking (`tsconfig.json`)
- **ESLint** — Linter with plugins for most core libraries (`eslint.config.js`)
- **Prettier** — Code formatter (`.prettierrc`)

## Framework & Routing

- **React** — Rendering framework, entry point in `src/main.tsx`
- **TanStack Router** — File-based type-safe routing in `src/routes/`
- **TanStack React Query** — Async logic and server state management

## Styling

- **Tailwind CSS** — Atomic CSS class names, entry point `src/styles.css`
- **@koyeb/design-system** — Custom component library and base styles
- **Lucide React** — SVG icon library
- **clsx** — Conditional CSS class string builder
- **class-variance-authority** — Variant-based class names builder

## Data Fetching & API

- **openapi-typescript** — Generates TypeScript types from the Koyeb OpenAPI spec

## Forms & Validation

- **React Hook Form** — Form state management
- **Zod** — Type safe runtime validation

## Third party integrations

- **WorkOS AuthKit** — Authentication management
- **Stripe** — Payment method collection
- **Seon** — Fraud detection and device fingerprinting
- **PostHog** — Product analytics and events tracking
- **Sentry** — Error tracking with session replay
- **Intercom** — Customer support chat widget

## UI Components & Visualization

- **Nivo** — Line and bar charts
- **CodeMirror** — Code editor
- **xterm.js** — Terminal emulator
- **Downshift** — Accessible select and combobox primitives
- **Motion** — Animation library (Framer Motion)
- **Mapbox** — Street address autocompletion

## Utilities

- **date-fns** — Date/time utilities and arithmetic
- **lodash-es** — General-purpose utility functions
- **query-string** — URL query string parsing and stringification
- **jwt-decode** — Decodes JWT tokens
- **tldts** — Top-level domain parsing
- **unique-names-generator** — Random human-readable name generation
- **dequal** — Deep equality comparison for memoization
- **diff** — Text diffing
- **unified / remark / rehype** — Markdown to React components pipeline
- **Shiki** — Syntax highlighter with accurate language grammars
- **ansi_up** — Converts ANSI escape codes to HTML

## Testing

- **Vitest** — Unit and component tests
- **@testing-library/react** — React component testing utilities
- **Playwright** — End-to-end browser tests

## Developer Tools

- **Storybook** — Component development environment
- **TanStack Devtools** — In-browser dev tools for inspecting route state and query cache
- **vite-plugin-svgr** — Transforms SVG files into React components at build time
- **vite-tsconfig-paths** — Resolves TypeScript path aliases in Vite
