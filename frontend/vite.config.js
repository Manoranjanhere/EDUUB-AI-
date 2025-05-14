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
    allowedHosts: ['eduub.mano.systems', 'eduubserver.mano.systems', 'localhost', '64.227.152.247']
  },
  // Define environment variables
  define: {
    // Make the backend URL consistent
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify('http://localhost:5000/api'),
  }
});