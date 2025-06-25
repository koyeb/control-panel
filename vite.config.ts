import fs from 'node:fs/promises';
import path from 'node:path';

import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
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
    tsconfigPaths(),
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
            '@uiw/codemirror-extensions-langs',
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
      '/v1': 'https://staging.koyeb.com',
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
    setupFiles: ['src/vitest.setup.ts'],
    restoreMocks: true,
  },
});

type OutputFileOptions = {
  filePath: string;
  content: () => string;
};

function outputFile({ filePath, content }: OutputFileOptions): Plugin {
  let dist = '';

  return {
    name: 'outputFile',
    configResolved(config) {
      dist = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      await fs.writeFile(path.join(dist, filePath), content());
    },
  };
}
