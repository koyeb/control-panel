import js from '@eslint/js';
import reactQuery from '@tanstack/eslint-plugin-query';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactRecommended from 'eslint-plugin-react/configs/recommended.js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const ci = process.env.CI === 'true';

export default [
  js.configs.recommended,
  ...(ci ? tseslint.configs.recommendedTypeChecked : tseslint.configs.recommended),
  {
    files: ['src/**/*.{ts,tsx}'],
    linterOptions: {
      reportUnusedDisableDirectives: ci ? 'error' : 'off',
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: ci,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@tanstack/query': reactQuery,
      'better-tailwindcss': eslintPluginBetterTailwindcss,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'better-tailwindcss': {
        entryPoint: 'src/styles.css',
      },
    },
    rules: {
      ...reactRecommended.rules,
      ...reactQuery.configs.recommended.rules,
      ...eslintPluginBetterTailwindcss.configs['recommended'].rules,
      'no-console': ci ? 'error' : 'off',
      'no-restricted-imports': ['warn', { paths: ['posthog-js', 'posthog-js/react'] }],
      '@typescript-eslint/no-deprecated': ci ? 'warn' : 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unnecessary-condition': ci ? 'warn' : 'off',
      '@typescript-eslint/only-throw-error': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { ignoreRestSiblings: true, varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': 'error',
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
      'better-tailwindcss/no-conflicting-classes': 'warn',
      'better-tailwindcss/no-unregistered-classes': ['warn', { ignore: ['dark', 'intercom-contact-us'] }],
    },
  },
  {
    files: ['src/**/*.stories.tsx'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  {
    files: ['eslint.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
];
