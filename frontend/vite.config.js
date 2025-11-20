import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    allowedHosts: ['eduub.mano.systems', 'eduubserver.mano.systems', 'localhost', '64.227.152.247']
  },
});