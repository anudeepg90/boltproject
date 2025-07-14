# URL Redirection Setup Guide

## Overview
This guide explains how to set up URL redirection for your LinkForge application using Supabase Edge Functions.

## Step 1: Deploy the Redirect Edge Function

### Prerequisites
- Supabase CLI installed (see installation instructions below)
- Supabase project linked to your local environment

### Install Supabase CLI
Choose the appropriate method for your operating system:

**macOS (using Homebrew):**
```bash
brew install supabase/tap/supabase
```

**Windows (using Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Linux/macOS (using npm):**
```bash
npm install -g supabase
```

**Direct Download:**
Download the latest release from [Supabase CLI GitHub releases](https://github.com/supabase/cli/releases)

### Deploy the Function
```bash
# Navigate to your project directory
cd your-project-directory

# Login to Supabase (if not already logged in)
supabase login

# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the redirect function
supabase functions deploy redirect
```

## Step 2: Configure Environment Variables

The edge function needs access to your Supabase credentials. These are automatically available in the edge function environment:

- `SUPABASE_URL` - Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (has elevated permissions)

## Step 3: Update Vite Configuration

Update your `vite.config.ts` file to proxy short URLs to the edge function:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy short URLs to Supabase Edge Function
      '^/[a-zA-Z0-9]{7}$': {
        target: 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/redirect',
        changeOrigin: true,
        rewrite: (path) => path,
      }
    }
  },
  // ... rest of config
});
```

Replace `YOUR_PROJECT_REF` with your actual Supabase project reference.

## Step 4: Run Database Migration

Execute the analytics tracking migration:

```bash
# Run the migration in Supabase SQL Editor
# Copy and paste the contents of supabase/migrations/add_analytics_tracking.sql
```

## Step 5: Test the Redirection

1. **Create a short link** using the application
2. **Copy the generated short URL** (e.g., `http://localhost:5173/abc123`)
3. **Open the short URL** in a new browser tab
4. **Verify redirection** to the original URL
5. **Check analytics** in the database to confirm tracking

## How It Works

### Development Environment
1. User clicks short URL (e.g., `http://localhost:5173/abc123`)
2. Vite proxy intercepts the request
3. Request is forwarded to Supabase Edge Function
4. Edge function looks up the short code in database
5. Edge function tracks analytics and increments click count
6. User is redirected to original URL

### Production Environment
1. Configure your domain's DNS to point short URLs to Supabase Edge Function
2. Set up custom domain in Supabase (if using custom domain)
3. Edge function handles all redirect logic

## Troubleshooting

### Common Issues

**1. 404 Error on Short URLs**
- Ensure edge function is deployed: `supabase functions list`
- Check Vite proxy configuration
- Verify project reference in proxy target URL

**2. Edge Function Not Found**
- Deploy function: `supabase functions deploy redirect`
- Check function logs: `supabase functions logs redirect`

**3. Database Connection Issues**
- Verify RLS policies allow function access
- Check service role key permissions

**4. Analytics Not Tracking**
- Verify `link_analytics` table exists
- Check RLS policies on analytics table
- Review edge function logs for errors

### Debugging Commands

```bash
# View edge function logs
supabase functions logs redirect

# List deployed functions
supabase functions list

# Test function locally
supabase functions serve redirect

# Check database connection
supabase db ping
```

## Production Deployment

### Custom Domain Setup
1. **Configure DNS** to point your domain to Supabase
2. **Update edge function** to handle custom domain
3. **Set up SSL certificate** through Supabase
4. **Update application** to generate URLs with custom domain

### Performance Optimization
- Edge functions are globally distributed
- Database queries are optimized with indexes
- Analytics tracking is asynchronous
- Caching can be added for frequently accessed links

## Security Considerations

- Edge function uses service role key (elevated permissions)
- RLS policies protect user data
- Input validation prevents injection attacks
- Rate limiting can be added to prevent abuse

## Monitoring

Monitor your redirect function through:
- Supabase Dashboard → Functions → Logs
- Database analytics for click tracking
- Custom monitoring solutions (optional)

---

Your URL redirection system is now fully functional! Users can click short links and be redirected to original URLs while analytics are automatically tracked.