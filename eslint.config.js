import js from '@eslint/js';
import reactQuery from '@tanstack/eslint-plugin-query';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const ci = process.env.CI === 'true';

export default [
  js.configs.recommended,
  ...(ci ? tseslint.configs.recommendedTypeChecked : tseslint.configs.recommended),
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  ...reactQuery.configs['flat/recommended'],
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
      'better-tailwindcss': betterTailwindcss,
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
      ...betterTailwindcss.configs.recommended['rules'],
      'no-console': ci ? 'error' : 'off',
      'no-restricted-imports': ['warn', { paths: ['posthog-js', 'posthog-js/react', 'lucide-react'] }],
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
      'react-hooks/incompatible-library': 'off',
      'react-hooks/refs': 'off',
      'react-refresh/only-export-components': 'error',
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
      'better-tailwindcss/no-conflicting-classes': 'warn',
      'better-tailwindcss/no-unregistered-classes': ['warn', { ignore: ['dark'] }],
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
