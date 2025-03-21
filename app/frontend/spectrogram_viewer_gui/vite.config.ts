import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import commonjs from 'vite-plugin-commonjs';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), commonjs()],
  assetsInclude: ['**/*.wasm', '**/*.data'],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  optimizeDeps: {
    include: ['scichart'],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
