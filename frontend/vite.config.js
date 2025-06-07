import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5500',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['react-toastify'],
          'vendor-socket': ['socket.io-client'],
          'vendor-http': ['axios']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
});
