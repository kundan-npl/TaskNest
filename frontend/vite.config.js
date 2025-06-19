import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Extract base URL without /api/v1 for proxy target
  const apiUrl = env.VITE_API_URL || 'http://localhost:5500/api/v1';
  const baseUrl = apiUrl.replace('/api/v1', '');
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      // Proxy configuration for development only
      // In production, the frontend will use VITE_API_URL directly
      proxy: {
        '/api': {
          target: baseUrl,
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
  };
});
