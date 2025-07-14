import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      proxy: env.VITE_SUPABASE_URL ? {
        // Only set up proxy if Supabase URL is configured
        '^/[a-zA-Z0-9]{7}$': {
          target: `${env.VITE_SUPABASE_URL}`,
          changeOrigin: true,
          rewrite: (path) => `/functions/v1/redirect${path}`,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('Proxy error - check your VITE_SUPABASE_URL in .env file:', err.message);
              // Send a proper error response instead of hanging
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Proxy connection failed. Please check your Supabase configuration.');
              }
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(`Proxying ${req.method} ${req.url} to ${options.target}${proxyReq.path}`);
            });
          }
        }
      } : {}
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
