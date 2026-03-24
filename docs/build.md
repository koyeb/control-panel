# Build

The project is built with [Vite](https://vite.dev/) and served by nginx in production via a multi-stage Docker build.

## Vite plugins

Configured in `vite.config.ts`, in order:

1. **`vite-tsconfig-paths`** — resolves the `src/*` path alias from `tsconfig.json`
2. **`@tanstack/router-plugin`** — auto-generates the route tree (`src/route-tree.generated.ts`) with code splitting from `src/routes/`
3. **`@vitejs/plugin-react`** — React Fast Refresh and JSX transform
4. **`@tailwindcss/vite`** — Tailwind CSS v4 native Vite integration (no PostCSS or `tailwind.config.js` needed)
5. **`vite-plugin-svgr`** — allows importing SVGs as React components (`import Logo from './logo.svg?react'`), with SVGO optimization
6. **`vite-plugin-preload`** — adds `<link rel="modulepreload">` tags for chunks
7. **Custom `outputFile` plugin** — generates `robots.txt` (disallows crawling unless production) and `version.txt` (git SHA)
8. **`@sentry/vite-plugin`** — uploads source maps to Sentry (requires `SENTRY_AUTH_TOKEN`)

## Path alias

`tsconfig.json` defines a path alias `src/*` → `./src/*`, resolved at build time by the `vite-tsconfig-paths` plugin. This allows absolute imports from the project root:

```ts
import { getConfig } from 'src/application/config';
```

Path alias might be used to reference files that are not part of the current module. Local imports should be used to import files from the same module:

```ts
import { LineGraph } from '../components/line-graph';
```

Imports from a module's internals should be avoided. This rule is not enforced, it's a guideline to keep in mind while organizing files and imports.

## Chunking strategy

Heavy libraries are split into dedicated chunks via `manualChunks` for better caching and parallel loading:

- `xterm` — `@xterm/xterm`
- `nivo` — `@nivo/line`, `@nivo/bar`
- `analytics` — `@sentry/react`, `posthog-js`
- `code-mirror` — `@uiw/codemirror-\*`, `@uiw/react-codemirror`
- `vendors` — `@floating-ui/react`, `downshift`, `react-hook-form`, `react-intl`, `zod`, `lodash-es`, etc.

Source maps are enabled (even in production) for Sentry error reporting and ease of debugging.

## Dev server

- Runs on port **8000**
- Proxies `/v1` requests to the `PROXY_API_URL` environment variable

If the `PROXY_API_URL` is set, the `API_URL` can be unset, so calls are made to the current domain. Vite reverse-proxies API calls, which can be useful to avoid cross origin issues.

## Environment variables

All `VITE_*` variables are statically replaced by Vite at build time. They are accessed through `getConfig()` in `src/application/config.ts`, which checks `localStorage` overrides first (see [config.md](config.md)).

## Docker build

The `Dockerfile` defines a two-stage build:

**Stage 1 (`build`)** — Node 20-slim with corepack/pnpm. Installs dependencies, receives all `VITE_*` env vars as build args, and runs `pnpm build`.

**Stage 2 (`nginx`)** — copies `dist/` into nginx's html directory and applies `nginx.conf`.

### nginx config

- Serves on port **3000**
- SPA fallback: all 404s return `index.html` with status 200 (client-side routing)
- CSP header: `frame-ancestors none` (prevents iframing)
