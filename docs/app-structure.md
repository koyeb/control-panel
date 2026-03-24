# Application Structure

## Configuration

- `package.json` — pnpm v10, with scripts for dev, build, lint, test, e2e, storybook, and api-codegen
- `tsconfig.json` — Strict TypeScript with ES6 target, path aliases (`src/*`), and JSX automatic runtime
- `vite.config.ts` — Build tool with plugins for routing, React, Tailwind, SVG conversion to components, and Sentry source maps
- `eslint.config.js` — Flat config with rules for React, TypeScript, React Hooks, TanStack Query, and Tailwind CSS class ordering
- `.prettierrc.json` — 110-char line width, single quotes, smart import sorting (Node → 3rd party → `src/` → relative)
- `playwright.config.ts` — E2E testing with Chromium, 10 parallel workers, trace collection on failure, 2 retries in CI
- `.vscode/settings.json` — VS Code settings — ESLint flat config, TypeScript SDK path, Tailwind CSS linting, generated files marked read-only
- `.vscode/tasks.json` — VS Code task — TypeScript watch with 16GB memory allocation

## Source Files

```
src/
├── main.tsx                    # Application entry point, initialization
├── model.ts                    # TypeScript types for all domain models
├── side-effects.ts             # Global effects (Sentry, Intercom init)
├── route-tree.generated.ts     # Auto-generated routing tree
│
├── api/                        # API client & hooks
│   ├── api.ts                  # Core fetch-based HTTP client
│   ├── api-error.ts            # ApiError class with error handling
│   ├── api-types.ts            # Shared API types
│   ├── api.generated.d.ts      # Generated types from Swagger (DO NOT EDIT)
│   ├── index.ts                # API provider & useApi hook
│   ├── hooks/                  # Custom hooks per domain
│   │   ├── app.ts              # App/project queries & mutations
│   │   ├── billing.ts          # Subscription & invoice queries
│   │   ├── catalog.ts          # Instance & region catalog queries
│   │   ├── git.ts              # Git repository queries
│   │   ├── project.ts          # Project context & queries
│   │   ├── service.ts          # Service & deployment queries
│   │   ├── session.ts          # User session queries
│   │   └── secret.ts           # Secret queries
│   ├── mappers/                # Response data transformation
│   │   ├── activity.ts         # Activity response mapping
│   │   ├── billing.ts          # Billing response mapping
│   │   ├── catalog.ts          # Catalog response mapping
│   │   ├── deployment.ts       # Deployment response mapping
│   │   ├── domain.ts           # Domain response mapping
│   │   ├── git.ts              # Git response mapping
│   │   ├── secret.ts           # Secret response mapping
│   │   ├── service.ts          # Service response mapping
│   │   ├── session.ts          # Session response mapping
│   │   └── volume.ts           # Volume response mapping
│   └── query.ts                # Query building utilities
│
├── application/                # App-wide services & configuration
│   ├── config.ts               # Environment configuration
│   ├── authkit.tsx             # WorkOS authentication setup
│   ├── errors.ts               # Custom error classes
│   ├── posthog.tsx             # Analytics initialization
│   ├── sentry.ts               # Error tracking setup
│   ├── validation.ts           # Zod schema configuration
│   ├── notify.ts               # Toast notification system
│   ├── storage.ts              # LocalStorage utilities
│   ├── types.ts                # App-wide types
│   └── [other utilities]       # URL latency, memory, region, etc.
│
├── components/                 # Reusable UI components (50+ files)
│   ├── dialog.tsx              # Modal dialog wrapper
│   ├── forms/                  # Form components
│   ├── selectors/              # Custom selectors
│   ├── logs/                   # Log viewer components
│   ├── regions-map/            # Interactive map
│   ├── terminal/               # Terminal emulator (xterm)
│   └── [many more...]
│
├── hooks/                      # Custom React hooks (15 files)
│   ├── clipboard.ts            # Copy-to-clipboard
│   ├── form.ts                 # Form handling wrapper
│   ├── entity-adapter.ts       # Entity state management
│   ├── router.ts               # Router utilities
│   └── [other hooks]
│
├── intl/                       # Internationalization
│   └── translation-provider.tsx
│
├── layouts/                    # Page layout templates
│   ├── main/                   # Main app layout
│   ├── onboarding/             # Onboarding flow layout
│   └── secondary/              # Secondary pages layout
│
├── modules/                    # Feature-specific UI modules
│   ├── account/                # Account management
│   ├── activity/               # Activity log
│   ├── command-palette/        # Global command palette
│   ├── database-form/          # Database service creation form
│   ├── deployment/             # Deployment management
│   ├── home/                   # Home page
│   ├── instance-selector/      # Instance type selector
│   ├── metrics/                # Metrics visualization
│   ├── project/                # Project management
│   ├── sandbox/                # Sandbox deployments
│   ├── secrets/                # Secrets management
│   ├── service-creation/       # Service creation flow
│   ├── service-form/           # Complex service creation form
│   ├── service-settings/       # Service settings
│   ├── services-list/          # Services list & filtering
│   └── trial/                  # Trial management & trial-ended modal
│
├── pages/                      # Page-level components
│   ├── service-page.tsx        # Service detail page
│   ├── deployment-page.tsx     # Deployment detail page
│   └── [others]
│
├── routes/                     # File-based routing (auto-generates route-tree)
│   ├── __root.tsx              # Root route with ErrorComponent
│   ├── _main/                  # Main app routes
│   ├── account/                # Account management routes
│   ├── auth/                   # Authentication routes
│   └── organization/           # Organization routes
│
├── utils/                      # Utility functions (20+ files)
│   ├── arrays.ts               # Array helpers
│   ├── assert.ts               # Assertion utilities
│   ├── promises.ts             # Promise utilities
│   └── types.ts                # TypeScript type utilities
│
└── styles.css                  # Global styles
```

## Key Files to Know

- `src/main.tsx` — App initialization, React Query setup
- `src/model.ts` — All TypeScript domain models
- `src/api/api.ts` — Low-level HTTP client
- `src/api/api-error.ts` — Error handling class
- `src/application/config.ts` — Environment configuration
- `src/application/authkit.tsx` — Authentication provider
- `src/routes/__root.tsx` — Root route with context
- `src/hooks/form.ts` — Form handling utilities
- `vite.config.ts` — Build configuration
- `tsconfig.json` — TypeScript configuration
- `Dockerfile` — Production build steps

## Custom Data

The `data/` folder is gitignored, allowing developers to store local files without committing them to the repository.
