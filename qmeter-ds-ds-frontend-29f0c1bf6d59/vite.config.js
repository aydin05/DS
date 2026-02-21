import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build',
    commonjsOptions: {
      include: [/custom-ckeditor5/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
  resolve: {
    alias: {
      'ckeditor5-custom-build': path.resolve(__dirname, 'custom-ckeditor5'),
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/,
    exclude: [],
  },
  optimizeDeps: {
    include: ['ckeditor5-custom-build'],
    esbuild: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
