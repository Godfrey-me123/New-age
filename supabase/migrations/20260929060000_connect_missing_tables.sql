-- Creates every table/bucket the app calls but the live database lacks.
-- Idempotent: safe to run more than once in the SQL editor.

CREATE TABLE IF NOT EXISTS public.token_packages (
  id text PRIMARY KEY,
  name text NOT NULL,
  usages integer NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  description text,
  visibility text NOT NULL DEFAULT 'public',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  bonus integer NOT NULL DEFAULT 0,
  promotion jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.weekly_offers (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text,
  tokens integer NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  start_date text,
  end_date text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Legacy profile mirror the app still reads/writes as a fallback.
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id text PRIMARY KEY,
  name text,
  phone text,
  email text,
  role text DEFAULT 'user',
  passkey text,
  tokens integer DEFAULT 0,
  status text DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['token_packages','weekly_offers','user_profiles'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "app access %s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "app access %s" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- Public bucket for admin background uploads.
INSERT INTO storage.buckets (id, name, public) VALUES ('backgrounds','backgrounds', true)
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "backgrounds read" ON storage.objects;
CREATE POLICY "backgrounds read" ON storage.objects FOR SELECT USING (bucket_id = 'backgrounds');
DROP POLICY IF EXISTS "backgrounds upload" ON storage.objects;
CREATE POLICY "backgrounds upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'backgrounds');
DROP POLICY IF EXISTS "backgrounds update" ON storage.objects;
CREATE POLICY "backgrounds update" ON storage.objects FOR UPDATE USING (bucket_id = 'backgrounds');
