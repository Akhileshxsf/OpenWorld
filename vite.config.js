import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    serve: {
      strictPort: true,
      // Example: serve all .png files with the "image/png" Content-Type
      headers: {
        '/public/*.png': {
          'Content-Type': 'image/png',
        },
      },
    },
  },
  plugins: [react()],
  assetsDir: 'public',
  base: '/',
});
