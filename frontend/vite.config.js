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
      clientPort: 5173,
      // Remove specific host references for Vercel deployment
      protocol: 'wss',
      timeout: 120000
    },
    // Add allowed hosts 
    allowedHosts: [
      'localhost', 
      '127.0.0.1',
      'eduub-ai.vercel.app'
    ],
    proxy: {
      '/api': {
        target: 'https://eduub-ai.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  // Define environment variables
  define: {
    // Set the backend URL to the new domain 
    'process.env.VITE_BACKEND_URL': JSON.stringify('https://eduub-ai.onrender.com/api')
  }
});