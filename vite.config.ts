import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    // Proxy disabled - deploy Edge Function via Supabase Dashboard to enable URL redirection
    server: {},
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});