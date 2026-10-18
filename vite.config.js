import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/my-ai/',
  server: {
    port: 5173,
    host: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        signup: resolve(__dirname, 'signup.html'),
      },
    },
  },
});

