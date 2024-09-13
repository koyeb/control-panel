import js from '@eslint/js';
import reactQuery from '@tanstack/eslint-plugin-query';
import importX from 'eslint-plugin-import-x';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactRecommended from 'eslint-plugin-react/configs/recommended.js';
import tailwind from 'eslint-plugin-tailwindcss';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const ci = process.env.CI === 'true';

export default [
  js.configs.recommended,
  ...(ci ? tseslint.configs.recommendedTypeChecked : tseslint.configs.recommended),
  ...tailwind.configs['flat/recommended'],
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
      'import-x': importX,
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@tanstack/query': reactQuery,
    },
    settings: {
      'import-x/resolver': {
        typescript: true,
      },
      react: {
        version: 'detect',
      },
      tailwindcss: {
        classRegex: '^class(Name|Names|es)?$',
        whitelist: ['intercom-contact-us'],
      },
    },
    rules: {
      ...reactRecommended.rules,
      ...importX.configs.recommended.rules,
      ...importX.configs.typescript.rules,
      ...importX.configs.react.rules,
      ...reactQuery.configs.recommended.rules,
      'no-console': ci ? 'error' : 'off',
      'no-restricted-imports': ['warn', { paths: ['wouter'] }],
      'import-x/no-duplicates': 'error',
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/order': [
        'warn',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
          groups: ['builtin', 'external', 'unknown', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            {
              pattern: 'src/**',
              group: 'internal',
            },
          ],
        },
      ],
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { ignoreRestSiblings: true, varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': 'error',
      'tailwindcss/no-arbitrary-value': 'warn',
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
