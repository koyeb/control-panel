import designSystemPreset from '@koyeb/design-system/tailwind-preset';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['node_modules/@koyeb/design-system/lib/*.js', 'src/**/*.{ts,tsx}', 'index.html'],
  darkMode: 'selector',
  presets: [designSystemPreset],
  theme: {
    extend: {
      screens: {
        '3xl': '1920px',
      },
      maxWidth: {
        main: '1200px',
      },
    },
  },
};
