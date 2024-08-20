import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    react(),
    svgr({ svgrOptions: { ref: true } }),
    dts({ rollupTypes: true, exclude: ['**/*.stories.tsx'] }),
  ],
  build: {
    outDir: 'lib',
    emptyOutDir: true,
    copyPublicDir: false,
    cssCodeSplit: true,
    lib: {
      formats: ['es'],
      entry: 'src/index.ts',
      fileName: 'main',
    },
    rollupOptions: {
      external: ['@floating-ui/react', 'clsx', 'downshift', 'react', 'react/jsx-runtime', 'react-dom'],
    },
  },
});
