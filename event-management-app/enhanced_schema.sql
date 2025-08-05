-- Enhanced schema for production-ready event management app

-- Add columns to existing events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_tickets INTEGER DEFAULT 100;
ALTER TABLE events ADD COLUMN IF NOT EXISTS available_tickets INTEGER DEFAULT 100;
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_name TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_address TEXT;

-- Enhanced tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_type TEXT DEFAULT 'general';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS price_paid DECIMAL(10,2) DEFAULT 0;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Event ratings and reviews
CREATE TABLE IF NOT EXISTS event_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(event_id, user_id)
);

-- Analytics table
CREATE TABLE IF NOT EXISTS event_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'view', 'ticket_purchase', 'rating', 'share'
  metric_value DECIMAL(10,2) DEFAULT 1,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  read BOOLEAN DEFAULT false,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_intent_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending', -- 'pending', 'succeeded', 'failed', 'canceled'
  transaction_type TEXT DEFAULT 'ticket', -- 'ticket', 'subscription'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- User subscription plans
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT DEFAULT 'standard', -- 'standard', 'pro'
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Event creation limits for standard users
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS events_created_this_month INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_event_creation_reset DATE DEFAULT CURRENT_DATE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS event_ratings_event_id_idx ON event_ratings(event_id);
CREATE INDEX IF NOT EXISTS event_analytics_event_id_idx ON event_analytics(event_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS payment_transactions_user_id_idx ON payment_transactions(user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;