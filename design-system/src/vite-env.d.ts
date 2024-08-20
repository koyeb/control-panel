/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module 'tailwindcss/lib/util/color' {
  export function parseColor(value: unknown): {
    color: [red: string, green: string, blue: string];
    alpha?: number;
  };
}
