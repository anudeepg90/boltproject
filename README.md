# LinkForge - Modern URL Shortener SaaS Platform

A comprehensive URL shortener web application built with React, TypeScript, and Supabase. LinkForge serves both guest users and premium subscribers with a modern, scalable SaaS platform.

## Features

### For Guest Users
- **Basic URL Shortening**: Shorten URLs with 7-day expiry
- **QR Code Generation**: View and download QR codes for shortened links
- **Copy Functionality**: One-click copy to clipboard
- **Basic Analytics**: View total click count

### For Premium Users
- **Unlimited Links**: No monthly limits
- **Advanced Analytics**: Detailed click analytics with geographic data
- **Custom Domains**: Use your own domain for branded links
- **Team Collaboration**: Share links with team members
- **Password Protection**: Secure sensitive links
- **Custom Expiration**: Set custom expiry dates
- **Bulk Operations**: Import/export links via CSV
- **API Access**: RESTful API for integrations

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **Icons**: Lucide React
- **Routing**: React Router v6
- **State Management**: React Context + Supabase client

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd linkforge
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Start the development server:
```bash
npm run dev
```

## Supabase Setup

### Database Schema

Run the following SQL in your Supabase SQL editor to create the required tables:

```sql
-- User profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  plan_type VARCHAR(20) DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Links table
CREATE TABLE links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  original_url TEXT NOT NULL,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  custom_alias VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  tags TEXT[],
  password_hash VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  click_count INTEGER DEFAULT 0
);

-- Analytics table
CREATE TABLE link_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID REFERENCES links(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  country VARCHAR(2),
  city VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(50)
);

-- QR Codes table
CREATE TABLE qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID REFERENCES links(id) ON DELETE CASCADE,
  style_config JSONB,
  file_path TEXT,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own links" ON links FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can create links" ON links FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own links" ON links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own links" ON links FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view analytics for own links" ON link_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM links WHERE links.id = link_analytics.link_id AND links.user_id = auth.uid())
);
CREATE POLICY "Analytics can be inserted for any link" ON link_analytics FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view QR codes for own links" ON qr_codes FOR SELECT USING (
  EXISTS (SELECT 1 FROM links WHERE links.id = qr_codes.link_id AND links.user_id = auth.uid())
);
CREATE POLICY "QR codes can be inserted for any link" ON qr_codes FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_links_user_id ON links(user_id);
CREATE INDEX idx_links_short_code ON links(short_code);
CREATE INDEX idx_analytics_link_id ON link_analytics(link_id);
CREATE INDEX idx_analytics_timestamp ON link_analytics(timestamp);
```

### Authentication Setup

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure your site URL and redirect URLs
3. Enable email confirmations if desired
4. Set up any OAuth providers you want to support

### Environment Variables

Make sure to set these environment variables in your Supabase project:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for server-side operations)

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   └── Navbar.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Input.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── lib/
│   ├── supabase.ts
│   └── utils.ts
├── pages/
│   ├── Analytics.tsx
│   ├── Dashboard.tsx
│   ├── LandingPage.tsx
│   ├── Login.tsx
│   ├── Pricing.tsx
│   ├── Register.tsx
│   └── Settings.tsx
├── types/
│   └── database.ts
├── App.css
├── App.tsx
├── index.css
└── main.tsx
```

## Features Implementation

### Guest User Experience
- Landing page with URL shortening form
- Automatic 7-day expiry for guest links
- QR code generation using external API
- Copy to clipboard functionality
- Basic click tracking

### Premium User Dashboard
- Comprehensive dashboard with statistics
- Link management with search and filtering
- Advanced analytics with charts
- Settings page for profile management
- Responsive design for all devices

### Authentication
- Email/password authentication via Supabase
- Protected routes for premium features
- User profile management
- Plan-based feature access

### Real-time Features
- Live analytics updates
- Real-time click tracking
- Instant UI updates for link operations

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with automatic SSL and global CDN

### Backend (Supabase)
- Database and authentication are handled by Supabase
- No additional backend deployment needed
- Built-in backups and scaling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@linkforge.com or join our Discord community.

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] API webhooks
- [ ] Advanced team features
- [ ] Custom analytics integrations
- [ ] White-label solutions

---

Built with ❤️ using React, TypeScript, and Supabase.# boltproject
