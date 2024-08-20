import type { Config } from 'tailwindcss';

import preset from './tailwind-preset';

export default {
  content: ['src/**/*.tsx'],
  darkMode: 'selector',
  presets: [preset],
} satisfies Config;
