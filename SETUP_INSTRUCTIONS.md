# LinkForge Setup Instructions

## Quick Setup Guide

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project name: "LinkForge"
5. Enter a strong database password
6. Choose your region (closest to your users)
7. Click "Create new project"
8. Wait for the project to be fully set up (2-3 minutes)

### Step 2: Get Your Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **Project API Keys** > **anon public** (long JWT token)

### Step 3: Configure Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values with your actual credentials:

```env
VITE_SUPABASE_URL=https://your-actual-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

**IMPORTANT**: Make sure there are no extra spaces or quotes around the values in your `.env` file.

### Step 4: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/migrations/create_database_schema.sql`
4. Paste it into the SQL editor
5. Click **Run** to execute the schema
6. You should see "Success. No rows returned" message

**CRITICAL**: Do NOT run the `supabase_fixes.sql` file as it contains problematic policies that will break authentication.

### Step 5: Configure Authentication (Optional)

1. Go to **Authentication** > **Settings**
2. Under **Site URL**, add: `http://localhost:5173`
3. Under **Redirect URLs**, add: `http://localhost:5173/**`
4. Disable **Enable email confirmations** for easier testing
5. Click **Save**

### Step 6: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## Verification Steps

### Test Guest Functionality
1. Go to `http://localhost:5173`
2. Enter a URL (e.g., `https://google.com`)
3. Click "Shorten URL"
4. You should see a shortened link and QR code

### Test User Registration
1. Click "Get Started" or "Sign Up"
2. Fill in the registration form
3. You should be redirected to the dashboard

### Verify Database Tables
1. In Supabase dashboard, go to **Table Editor**
2. You should see these tables:
   - `user_profiles`
   - `links`
   - `link_analytics`
   - `qr_codes`

## Troubleshooting

### Error: "Supabase request failed" with 404
- **Cause**: Database tables don't exist or wrong credentials
- **Solution**: 
  1. Verify your `.env` file has correct credentials
  2. Run the SQL schema in Supabase SQL Editor
  3. Restart your development server

### Error: "invalid claim: missing sub claim"
- **Cause**: Corrupted authentication session or wrong JWT token
- **Solution**:
  1. Clear browser localStorage and cookies for localhost:5173
  2. Verify VITE_SUPABASE_ANON_KEY is correct in .env file
  3. Restart development server
  4. Try signing out and signing back in

### Error: "socket hang up" in proxy
- **Cause**: Edge Function not deployed or Supabase URL incorrect
- **Solution**:
  1. Verify VITE_SUPABASE_URL in .env file
  2. Deploy the redirect Edge Function (see DEPLOYMENT_GUIDE.md)
  3. Check Edge Function logs in Supabase dashboard

### Error: "Invalid API key"
- **Cause**: Wrong anon key in `.env` file
- **Solution**: Double-check the anon key from Supabase dashboard

### Error: "Cross-origin request blocked"
- **Cause**: Site URL not configured in Supabase
- **Solution**: Add `http://localhost:5173` to Site URL in Auth settings

### Tables not visible in Table Editor
- **Cause**: SQL schema wasn't executed properly
- **Solution**: Re-run the SQL schema, check for any error messages

### Clear Browser Data (if authentication issues persist)
1. Open browser developer tools (F12)
2. Go to Application/Storage tab
3. Clear all localStorage data for localhost:5173
4. Clear all cookies for localhost:5173
5. Refresh the page and try again

## Next Steps

Once everything is working:

1. **Test all features** to ensure proper functionality
2. **Deploy to production** when ready
3. **Set up custom domain** for branded short links
4. **Configure Stripe** for payment processing
5. **Add monitoring** and analytics

## Support

If you encounter any issues:
1. Check the browser console for detailed error messages
2. Verify all environment variables are correct
3. Ensure database schema was executed successfully
4. Check Supabase logs in the dashboard

The application should now work perfectly with full guest and premium user functionality!