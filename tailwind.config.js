import designSystemPreset from './design-system/tailwind-preset';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['design-system/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}', 'index.html'],
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
