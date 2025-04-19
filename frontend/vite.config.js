// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allows connections from all network interfaces
    port: 5173,
    strictPort: true,
    cors: true,
    // Fix the HMR configuration
    hmr: {
      // Use clientPort: 443 for HTTPS connections
      clientPort: 443,
      // Remove the host property or set it to the public domain
      host: 'eduub.mano.systems',
      // Add these options for better compatibility
      protocol: 'wss',
      timeout: 120000
    },
    // Add allowed hosts 
    allowedHosts: [
      'eduub.mano.systems', 
      'eduubserver.mano.systems', 
      'localhost', 
      '127.0.0.1',
      '64.227.152.247',
      '167.71.229.78'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  // Define environment variables
  define: {
    // Make the backend URL consistent
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify('http://167.71.229.78:5173/api'),
  }
});