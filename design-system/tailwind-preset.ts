import colors from 'tailwindcss/colors';
import defaultTheme from 'tailwindcss/defaultTheme';
import { parseColor } from 'tailwindcss/lib/util/color';
import { PresetsConfig } from 'tailwindcss/types/config';

function toRgb(color: unknown) {
  return parseColor(color).color.join(' ');
}

function toRgbObject(colors: Record<string, unknown>) {
  return Object.entries(colors).reduce((obj, [name, color]) => ({ ...obj, [name]: toRgb(color) }), {});
}

const commonColors = {
  inherit: colors.inherit,
  transparent: colors.transparent,
  current: colors.current,
  white: colors.white,
  black: colors.black,
};

const backgroundColors = {
  neutral: 'rgb(var(--color-background-neutral) / <alpha-value>)',
  inverted: 'rgb(var(--color-background-inverted) / <alpha-value>)',
  red: 'rgb(var(--color-background-red) / <alpha-value>)',
  green: 'rgb(var(--color-background-green) / <alpha-value>)',
  blue: 'rgb(var(--color-background-blue) / <alpha-value>)',
  orange: 'rgb(var(--color-background-orange) / <alpha-value>)',
  gray: 'rgb(var(--color-background-gray) / <alpha-value>)',
};

const contrastColors = {
  red: 'rgb(var(--color-text-red-contrast) / <alpha-value>)',
  green: 'rgb(var(--color-text-green-contrast) / <alpha-value>)',
  blue: 'rgb(var(--color-text-blue-contrast) / <alpha-value>)',
  orange: 'rgb(var(--color-text-orange-contrast) / <alpha-value>)',
  gray: 'rgb(var(--color-text-gray-contrast) / <alpha-value>)',
  popover: 'rgb(var(--color-text-popover-contrast) / <alpha-value>)',
};

export default {
  theme: {
    colors: {
      rgb: {
        white: toRgb(colors.white),
        black: toRgb(colors.black),
        zinc: toRgbObject(colors.zinc),
        gray: toRgbObject(colors.gray),
        stone: toRgbObject(colors.stone),
        neutral: toRgbObject(colors.neutral),
        red: toRgbObject(colors.red),
        amber: toRgbObject(colors.amber),
        emerald: toRgbObject(colors.emerald),
        sky: toRgbObject(colors.sky),
      },
      ...commonColors,
      ...backgroundColors,
    },
    backgroundColor: {
      ...commonColors,
      ...backgroundColors,
      muted: 'rgb(var(--color-background-muted) / <alpha-value>)',
      popover: 'rgb(var(--color-background-popover) / <alpha-value>)',
    },
    textColor: {
      ...commonColors,
      default: 'rgb(var(--color-text-default) / <alpha-value>)',
      inverted: 'rgb(var(--color-text-inverted) / <alpha-value>)',
      dim: 'rgb(var(--color-text-dim) / <alpha-value>)',
      placeholder: 'rgb(var(--color-text-placeholder) / <alpha-value>)',
      red: 'rgb(var(--color-text-red) / <alpha-value>)',
      green: 'rgb(var(--color-text-green) / <alpha-value>)',
      blue: 'rgb(var(--color-text-blue) / <alpha-value>)',
      orange: 'rgb(var(--color-text-orange) / <alpha-value>)',
      gray: 'rgb(var(--color-text-gray) / <alpha-value>)',
      contrast: contrastColors,
    },
    borderColor: {
      ...commonColors,
      ...backgroundColors,
      default: 'rgb(var(--color-border-default) / <alpha-value>)',
      strong: 'rgb(var(--color-border-strong) / <alpha-value>)',
      contrast: contrastColors,
    },
    fontFamily: {
      sans: ['Inter Variable', ...defaultTheme.fontFamily.sans],
      mono: ['JetBrains Mono Variable', ...defaultTheme.fontFamily.mono],
      gilroy: ['Gilroy', ...defaultTheme.fontFamily.sans],
    },
    extend: {
      spacing: {
        em: '1em',
      },
      boxShadow: {
        badge: '0 0 2px rgba(0, 0, 0, 0.55)',
      },
    },
  },
} satisfies PresetsConfig;
