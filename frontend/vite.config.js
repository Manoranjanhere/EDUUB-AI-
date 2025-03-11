// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Add this section to allow your domain:
    cors: true,
    hmr: {
      host: 'localhost',
    },
    // Add allowed hosts 
    allowedHosts: ['eduub.mano.systems','eduubserver.mano.systems', 'localhost', '64.227.152.247']
  },
});