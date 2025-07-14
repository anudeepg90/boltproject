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
      proxy: env.VITE_SUPABASE_URL && env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co' ? {
        // Only set up proxy if Supabase URL is properly configured
        '^/[a-zA-Z0-9]{7}$': {
          target: `${env.VITE_SUPABASE_URL}/functions/v1/redirect`,
          changeOrigin: true,
          rewrite: (path) => path,
          timeout: 15000,
          secure: true,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('Proxy error - Edge Function may not be deployed:', err.message);
              console.log('To fix this:');
              console.log('1. Deploy the redirect Edge Function: supabase functions deploy redirect');
              console.log('2. Verify VITE_SUPABASE_URL in .env file');
              console.log('3. Check Supabase project is accessible');
              
              if (!res.headersSent) {
                res.writeHead(404, { 
                  'Content-Type': 'text/html',
                  'Access-Control-Allow-Origin': '*'
                });
                res.end(`
                  <!DOCTYPE html>
                  <html>
                  <head><title>Redirect Service Unavailable</title></head>
                  <body>
                    <h1>Redirect Service Unavailable</h1>
                    <p>The redirect Edge Function is not deployed or accessible.</p>
                    <p>Please deploy it using: <code>supabase functions deploy redirect</code></p>
                    <p><a href="/">Go back to homepage</a></p>
                  </body>
                  </html>
                `);
              }
            });
            
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(`Redirecting ${req.method} ${req.url} to Edge Function`);
            });
          }
        }
      } : undefined
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});