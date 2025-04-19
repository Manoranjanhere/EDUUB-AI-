// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allows connections from all network interfaces
    port: 5173,
    cors: true,
    // Fix the HMR configuration
    hmr: {
      // Use clientPort: 443 for HTTPS connections
      clientPort: 5173,
      // Use IP address instead of domain
      host: '167.71.229.78',
      // Add these options for better compatibility
      protocol: 'wss',
      timeout: 120000
    },
    // Add allowed hosts 
    allowedHosts: [
      '167.71.229.78',
      '64.227.152.247',
      'localhost', 
      '127.0.0.1'
    ],
    proxy: {
      '/api': {
        target: 'http://167.71.229.78:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  // Define environment variables
  define: {
    // Make the backend URL consistent using IP address
    'process.env.VITE_BACKEND_URL': JSON.stringify('http://167.71.229.78:5000')
  }
});