-- ============================================================
-- Pickup - Campus Micro-Job Marketplace
-- Initial Database Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE job_category AS ENUM (
  'tutoring',
  'moving',
  'design',
  'errands',
  'tech',
  'other'
);

CREATE TYPE job_status AS ENUM (
  'open',
  'in_progress',
  'completed',
  'disputed',
  'cancelled'
);

CREATE TYPE escrow_status AS ENUM (
  'locked',
  'released',
  'refunded',
  'disputed'
);

CREATE TYPE dispute_status AS ENUM (
  'open',
  'resolved'
);

-- ============================================================
-- TABLES
-- ============================================================

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  campus_email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  wallet_balance NUMERIC DEFAULT 100 NOT NULL,
  fake_wallet_address TEXT,
  rating NUMERIC DEFAULT 0 NOT NULL,
  total_jobs_completed INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT wallet_balance_non_negative CHECK (wallet_balance >= 0),
  CONSTRAINT rating_valid CHECK (rating >= 0 AND rating <= 5)
);

-- Jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category job_category NOT NULL,
  payment_amount NUMERIC NOT NULL,
  status job_status DEFAULT 'open' NOT NULL,
  acceptor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  escrow_locked BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deadline TIMESTAMPTZ,

  CONSTRAINT payment_amount_positive CHECK (payment_amount > 0),
  CONSTRAINT not_self_accept CHECK (poster_id != acceptor_id)
);

-- Escrow transactions table
CREATE TABLE public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status escrow_status DEFAULT 'locked' NOT NULL,
  tx_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT amount_positive CHECK (amount > 0),
  CONSTRAINT different_users CHECK (from_user_id != to_user_id)
);

-- Ratings table
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ratee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT score_valid CHECK (score >= 1 AND score <= 5),
  CONSTRAINT no_self_rating CHECK (rater_id != ratee_id),
  UNIQUE(job_id, rater_id)
);

-- Disputes table
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status dispute_status DEFAULT 'open' NOT NULL,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_jobs_poster_id ON public.jobs(poster_id);
CREATE INDEX idx_jobs_acceptor_id ON public.jobs(acceptor_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_category ON public.jobs(category);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);

CREATE INDEX idx_escrow_transactions_job_id ON public.escrow_transactions(job_id);
CREATE INDEX idx_escrow_transactions_from_user ON public.escrow_transactions(from_user_id);
CREATE INDEX idx_escrow_transactions_to_user ON public.escrow_transactions(to_user_id);

CREATE INDEX idx_ratings_job_id ON public.ratings(job_id);
CREATE INDEX idx_ratings_ratee_id ON public.ratings(ratee_id);
CREATE INDEX idx_ratings_rater_id ON public.ratings(rater_id);

CREATE INDEX idx_disputes_job_id ON public.disputes(job_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: USERS
-- ============================================================

-- Anyone can view user profiles
CREATE POLICY "Users are viewable by everyone"
  ON public.users FOR SELECT
  USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- RLS POLICIES: JOBS
-- ============================================================

-- Anyone can view jobs
CREATE POLICY "Jobs are viewable by everyone"
  ON public.jobs FOR SELECT
  USING (true);

-- Authenticated users can create jobs
CREATE POLICY "Authenticated users can create jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = poster_id);

-- Poster can update their own jobs (or acceptor updating acceptor_id)
CREATE POLICY "Jobs can be updated by involved parties"
  ON public.jobs FOR UPDATE
  USING (
    auth.uid() = poster_id OR
    auth.uid() = acceptor_id OR
    (status = 'open' AND auth.uid() IS NOT NULL)
  );

-- Only poster can delete their own open jobs
CREATE POLICY "Poster can delete their own open jobs"
  ON public.jobs FOR DELETE
  USING (auth.uid() = poster_id AND status = 'open');

-- ============================================================
-- RLS POLICIES: ESCROW TRANSACTIONS
-- ============================================================

-- Involved parties can view escrow transactions
CREATE POLICY "Escrow transactions viewable by involved users"
  ON public.escrow_transactions FOR SELECT
  USING (
    auth.uid() = from_user_id OR
    auth.uid() = to_user_id
  );

-- Any authenticated user can insert (we validate in server action)
CREATE POLICY "Authenticated users can create escrow transactions"
  ON public.escrow_transactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Involved parties can update escrow transactions
CREATE POLICY "Escrow transactions can be updated by involved users"
  ON public.escrow_transactions FOR UPDATE
  USING (
    auth.uid() = from_user_id OR
    auth.uid() = to_user_id
  );

-- ============================================================
-- RLS POLICIES: RATINGS
-- ============================================================

-- Anyone can view ratings
CREATE POLICY "Ratings are viewable by everyone"
  ON public.ratings FOR SELECT
  USING (true);

-- Authenticated users can submit ratings (validated in server action)
CREATE POLICY "Authenticated users can submit ratings"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = rater_id);

-- ============================================================
-- RLS POLICIES: DISPUTES
-- ============================================================

-- Involved parties can view disputes
CREATE POLICY "Disputes viewable by involved users"
  ON public.disputes FOR SELECT
  USING (
    auth.uid() = raised_by OR
    auth.uid() IN (
      SELECT poster_id FROM public.jobs WHERE id = job_id
      UNION
      SELECT acceptor_id FROM public.jobs WHERE id = job_id
    )
  );

-- Authenticated users can raise disputes (validated in server action)
CREATE POLICY "Authenticated users can raise disputes"
  ON public.disputes FOR INSERT
  WITH CHECK (auth.uid() = raised_by);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if not already exists (avoids conflicts with manual inserts)
  INSERT INTO public.users (id, full_name, campus_email, avatar_url, wallet_balance, fake_wallet_address, rating, total_jobs_completed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Anonymous User'),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    100,
    NULL,
    0,
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on new auth user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user average rating
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_score NUMERIC;
BEGIN
  SELECT AVG(score)::NUMERIC(3,1) INTO avg_score
  FROM public.ratings
  WHERE ratee_id = NEW.ratee_id;

  UPDATE public.users
  SET rating = COALESCE(avg_score, 0)
  WHERE id = NEW.ratee_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update rating on new rating insert
CREATE OR REPLACE TRIGGER on_rating_inserted
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_user_rating();

-- ============================================================
-- REALTIME CONFIGURATION
-- ============================================================

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.escrow_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;

-- ============================================================
-- SAMPLE DATA (Optional - for development)
-- ============================================================

-- Uncomment below to add sample data for development
/*
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'alice@university.edu', crypt('password123', gen_salt('bf')), NOW(), '{"full_name": "Alice Johnson"}'),
  ('00000000-0000-0000-0000-000000000002', 'bob@university.edu', crypt('password123', gen_salt('bf')), NOW(), '{"full_name": "Bob Smith"}');

INSERT INTO public.users (id, full_name, campus_email, wallet_balance, rating, total_jobs_completed)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Alice Johnson', 'alice@university.edu', 150, 4.8, 12),
  ('00000000-0000-0000-0000-000000000002', 'Bob Smith', 'bob@university.edu', 75, 4.2, 5);

INSERT INTO public.jobs (poster_id, title, description, category, payment_amount, status)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Help me move into dorm', 'Need help carrying boxes from car to 3rd floor. About 20 boxes.', 'moving', 25, 'open'),
  ('00000000-0000-0000-0000-000000000001', 'Need calculus tutor', 'Struggling with derivatives and integrals. 2 hour session needed.', 'tutoring', 30, 'open'),
  ('00000000-0000-0000-0000-000000000002', 'Logo design for club', 'Need a logo for our photography club. Modern and clean style.', 'design', 50, 'open');
*/
