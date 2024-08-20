import globals from 'globals';
import importX from 'eslint-plugin-import-x';
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRecommended from 'eslint-plugin-react/configs/recommended.js';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import tailwind from 'eslint-plugin-tailwindcss';

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
    },
    settings: {
      'import-x/resolver': {
        typescript: true,
      },
      react: {
        version: 'detect',
      },
      tailwindcss: {
        classRegex: '^class(Name|Names)?$',
      },
    },
    rules: {
      ...importX.configs.recommended.rules,
      ...importX.configs.typescript.rules,
      ...importX.configs.react.rules,
      ...reactRecommended.rules,
      'no-console': ci ? 'error' : 'off',
      'import-x/no-duplicates': 'error',
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/order': [
        'warn',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
          groups: ['builtin', 'external', 'unknown', 'internal', 'parent', 'sibling', 'index'],
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
