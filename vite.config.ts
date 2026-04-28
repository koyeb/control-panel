import fs from 'node:fs/promises';
import path from 'node:path';

import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import tanstackRouter from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { Plugin } from 'vite';
import preload from 'vite-plugin-preload';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

dotenv.config();

export default defineConfig({
  plugins: [
    !process.env.VITE_WORK_OS_CLIENT_ID && mockLocalApis(),
    tsconfigPaths(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/routes',
      generatedRouteTree: './src/route-tree.generated.ts',
      tmpDir: 'node_modules/.tanstack',
    }),
    react(),
    tailwindcss(),
    svgr({
      svgrOptions: {
        ref: true,
        plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
        svgoConfig: {
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  removeViewBox: false,
                  cleanupIds: false,
                },
              },
            },
            'prefixIds',
          ],
        },
      },
    }),
    preload(),
    outputFile({
      filePath: 'robots.txt',
      content() {
        const disallow = () => {
          if (process.env.VITE_ENVIRONMENT !== 'production') {
            return 'Disallow: /';
          }

          return `Disallow:`;
        };

        return ['User-agent: *', disallow(), ''].join('\n');
      },
    }),
    outputFile({
      filePath: 'version.txt',
      content: () => process.env.VITE_APP_VERSION ?? 'unknown',
    }),
    sentryVitePlugin({
      org: 'gokoyeb',
      project: 'kdx',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: { name: process.env.VITE_APP_VERSION },
      silent: true,
      telemetry: false,
    }),
  ],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          xterm: ['@xterm/xterm'],
          nivo: ['@nivo/line', '@nivo/bar'],
          analytics: ['@sentry/react', 'posthog-js'],
          'code-mirror': [
            '@uiw/codemirror-theme-github',
            '@uiw/react-codemirror',
          ],
          vendors: [
            '@floating-ui/react',
            'ansi_up',
            'downshift',
            'react-hook-form',
            'react-intl',
            'tldts',
            'unique-names-generator',
            'zod',
            'lodash-es',
          ],
        },
      },
    },
  },
  server: {
    port: 8000,
    proxy: {
      '/v1': {
        target: process.env.PROXY_API_URL!,
        ws: true,
      },
    },
  },
  preview: {
    port: 3000,
  },
  test: {
    watch: false,
    environment: 'happy-dom',
    reporters: 'verbose',
    dir: 'src',
    restoreMocks: true,
  },
});

type OutputFileOptions = {
  filePath: string;
  content: () => string;
};

const mockData = {
  user: {
    id: 'a1b2c3d4-0000-4000-a000-000000000001',
    name: 'Local Developer',
    email: 'dev@localhost',
    email_validated: true,
    avatar_url: 'https://gravatar.com/avatar',
    flags: [],
    github_id: '',
    github_user: '',
    newsletter_subscribed: false,
    trialed: false,
    two_factor_authentication: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
  },
  organization: {
    id: 'a1b2c3d4-e5f6-4890-abcd-ef1234567890',
    name: 'default',
    external_id: 'a1b2c3d4-e5f6-4890-abcd-ef1234567890',
    status: 'ACTIVE' as const,
    status_message: 'VALID' as const,
    plan: 'internal' as const,
    default_project_id: 'a1b2c3d4-0000-4000-a000-000000000002',
    has_payment_method: false,
    verified: true,
    trialing: false,
    company: false,
    signup_qualification: { completed: 'true' },
    plan_updated_at: new Date().toISOString(),
  },
  project: {
    id: 'a1b2c3d4-0000-4000-a000-000000000002',
    name: 'default',
    description: '',
    organization_id: 'a1b2c3d4-e5f6-4890-abcd-ef1234567890',
    service_count: '0',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

function mockLocalApis(): Plugin {
  const routes: Record<string, (url: URL) => unknown> = {
    '/v1/account/profile': () => ({ user: mockData.user }),
    '/v1/account/organization': () => ({ organization: mockData.organization }),
    '/v1/account/organizations': () => ({
      organizations: [mockData.organization],
      has_next: false,
      limit: 10,
      offset: 0,
    }),
    '/v1/account/settings': () => ({
      settings: { failed_deployment_email_notification: false },
    }),
    '/v1/account/organization_invitations': () => ({
      invitations: [],
      count: 0,
      limit: 100,
      offset: 0,
    }),
    '/v1/projects': () => ({
      projects: [mockData.project],
      has_next: false,
      limit: 10,
      offset: 0,
    }),
    '/v1/activities': () => ({
      activities: [],
      has_next: false,
      limit: 100,
      offset: 0,
    }),
    '/v1/streams/metrics': () => ({
      metrics: [],
    }),
    '/v1/organization_members': () => ({
      members: [
        {
          id: 'local-dev-member',
          user_id: mockData.user.id,
          organization_id: mockData.organization.id,
          role: 'OWNER',
          status: 'ACTIVE',
          joined_at: new Date().toISOString(),
          user: {
            id: mockData.user.id,
            name: mockData.user.name,
            email: mockData.user.email,
            avatar_url: mockData.user.avatar_url,
          },
        },
      ],
      has_next: false,
      limit: 10,
      offset: 0,
    }),
  };

  const paramRoutes: Array<{ pattern: RegExp; handler: (match: RegExpMatchArray) => unknown }> = [
    {
      pattern: /^\/v1\/projects\/([^/]+)$/,
      handler: () => ({ project: mockData.project }),
    },
    {
      pattern: /^\/v1\/organizations\/([^/]+)\/quotas$/,
      handler: () => ({
        quotas: {
          max_projects: '10',
          apps: '100',
          services: '100',
          max_organization_members: '5',
          instance_types: [],
          max_instances_by_type: {},
          regions: [],
          persistent_volumes_by_region: {},
          memory_mb: '4096',
          custom_domains: '10',
          logs_retention: 7,
          scale_to_zero: {
            is_light_sleep_enabled: true,
            light_sleep_idle_delay_min: 300,
            light_sleep_idle_delay_max: 600,
            is_deep_sleep_enabled: false,
            deep_sleep_idle_delay_min: 0,
            deep_sleep_idle_delay_max: 0,
          },
          lifecycle: {
            delete_after_create_min: 0,
            delete_after_create_max: 0,
            delete_after_sleep_min: 0,
            delete_after_sleep_max: 0,
          },
        },
      }),
    },
    {
      pattern: /^\/v1\/organizations\/([^/]+)\/summary$/,
      handler: () => ({
        summary: {
          organization_id: mockData.organization.id,
          instances: { by_type: { free: '0' } },
          neon_postgres: { by_instance_type: { free: '0' } },
          apps: { by_status: {}, total: '0' },
          domains: { by_status: {}, total: '0' },
          members: { by_role: {}, total: '1' },
          secrets: { by_type: {}, total: '0' },
          services: {},
        },
      }),
    },
  ];

  return {
    name: 'mock-local-apis',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);

        // check exact routes
        const handler = routes[url.pathname];

        if (handler) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(handler(url)));
          return;
        }

        // check parameterized routes
        for (const route of paramRoutes) {
          const match = url.pathname.match(route.pattern);

          if (match) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(route.handler(match)));
            return;
          }
        }

        // fallback for non-GET /v1/account/* (mutations)
        if (url.pathname.startsWith('/v1/account') && req.method !== 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({}));
          return;
        }

        next();
      });
    },
  };
}

function outputFile({ filePath, content }: OutputFileOptions): Plugin {
  let dist = '';

  return {
    name: 'outputFile',
    configResolved(config) {
      dist = path.resolve(config.root, config.build.outDir);
    },
    async writeBundle() {
      await fs.writeFile(path.join(dist, filePath), content());
    },
  };
}
