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
          timeout: 10000, // 10 second timeout
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('Proxy error - Edge Function may not be deployed or accessible:', err.message);
              console.log('Please check:');
              console.log('1. VITE_SUPABASE_URL is correct in .env file');
              console.log('2. Edge Function "redirect" is deployed in Supabase');
              console.log('3. Supabase project is accessible');
              
              // Send a proper error response instead of hanging
              if (!res.headersSent) {
                res.writeHead(404, { 
                  'Content-Type': 'text/html',
                  'Access-Control-Allow-Origin': '*'
                });
                res.end(`
                  <!DOCTYPE html>
                  <html>
                  <head><title>Link Not Found</title></head>
                  <body>
                    <h1>Link Not Found</h1>
                    <p>The short link you're looking for doesn't exist or the redirect service is unavailable.</p>
                    <p><a href="/">Go back to homepage</a></p>
                  </body>
                  </html>
                `);
              }
            });
            
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(`Proxying ${req.method} ${req.url} to ${options.target}${proxyReq.path}`);
            });
            
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log(`Proxy response: ${proxyRes.statusCode} for ${req.url}`);
            });
          }
        }
      } : {
        // Fallback when no Supabase URL is configured
        '^/[a-zA-Z0-9]{7}$': {
          target: 'http://localhost:5173',
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              if (!res.headersSent) {
                res.writeHead(404, { 
                  'Content-Type': 'text/html',
                  'Access-Control-Allow-Origin': '*'
                });
                res.end(`
                  <!DOCTYPE html>
                  <html>
                  <head><title>Configuration Required</title></head>
                  <body>
                    <h1>Supabase Not Configured</h1>
                    <p>Please configure your VITE_SUPABASE_URL in the .env file.</p>
                    <p><a href="/">Go back to homepage</a></p>
                  </body>
                  </html>
                `);
              }
            });
          }
        }
      }
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});