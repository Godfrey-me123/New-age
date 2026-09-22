import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read configuration from environment or fallback.
// vite.config.ts maps the Supabase integration's injected names
// (NEXT_PUBLIC_SUPABASE_* / SUPABASE_*) onto VITE_SUPABASE_* at build time,
// but we also read the raw names here for robustness across contexts.
const metaEnv = (import.meta as any).env || {};
const procEnv = typeof process !== 'undefined' ? process.env || {} : {};
const supabaseUrl =
  metaEnv.VITE_SUPABASE_URL ||
  metaEnv.NEXT_PUBLIC_SUPABASE_URL ||
  procEnv.VITE_SUPABASE_URL ||
  procEnv.NEXT_PUBLIC_SUPABASE_URL ||
  procEnv.SUPABASE_URL ||
  '';
const supabaseAnonKey =
  metaEnv.VITE_SUPABASE_ANON_KEY ||
  metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  procEnv.VITE_SUPABASE_ANON_KEY ||
  procEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  procEnv.SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('YOUR_SUPABASE')
);

// Initialize Supabase Client with persistent session handling
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'bigsta_supabase_auth_token',
      },
    })
  : null;

/**
 * SQL Schema definition for PROMPT 50 Migration
 */
export const SUPABASE_SQL_SCHEMA = `
-- =========================================================
-- BIGsta Supabase Database Foundation Migration Schema (Phases 1-10)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access users" ON public.users FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY,
  name TEXT,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'user',
  passkey TEXT,
  tokens INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access user_profiles" ON public.user_profiles FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  name TEXT,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'user',
  passkey TEXT,
  tokens INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow individual insert/update profiles" ON public.profiles FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.token_wallets (
  id TEXT PRIMARY KEY,
  user_id UUID,
  balance INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.token_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access token_wallets" ON public.token_wallets FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.tokens (
  id TEXT PRIMARY KEY,
  user_id UUID,
  balance INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access tokens" ON public.tokens FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  service_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access services" ON public.services FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.template_categories (
  id TEXT PRIMARY KEY,
  category_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access template_categories" ON public.template_categories FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.templates (
  id TEXT PRIMARY KEY,
  service_type TEXT NOT NULL,
  template_name TEXT,
  template_json JSONB NOT NULL,
  background_url TEXT,
  is_universal BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  created_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select templates" ON public.templates FOR SELECT USING (true);
CREATE POLICY "Allow full write templates" ON public.templates FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.template_versions (
  id TEXT PRIMARY KEY,
  template_id TEXT REFERENCES public.templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  template_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.template_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access template_versions" ON public.template_versions FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.template_elements (
  id TEXT PRIMARY KEY,
  template_id TEXT REFERENCES public.templates(id) ON DELETE CASCADE,
  element_name TEXT,
  element_type TEXT,
  element_json JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.template_elements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access template_elements" ON public.template_elements FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.user_generated_cards (
  id TEXT PRIMARY KEY,
  user_id UUID,
  service_type TEXT,
  card_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_generated_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access user_generated_cards" ON public.user_generated_cards FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.background_assets (
  id TEXT PRIMARY KEY,
  name TEXT,
  url TEXT NOT NULL,
  service_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.background_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select background_assets" ON public.background_assets FOR SELECT USING (true);
CREATE POLICY "Allow full write background_assets" ON public.background_assets FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.token_transactions (
  id TEXT PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access token_transactions" ON public.token_transactions FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.user_payments (
  id TEXT PRIMARY KEY,
  user_id UUID,
  user_name TEXT,
  user_phone TEXT,
  amount NUMERIC NOT NULL,
  sender TEXT,
  receiver TEXT,
  reference TEXT,
  status TEXT DEFAULT 'PENDING',
  payment_date TEXT,
  tokens_granted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access user_payments" ON public.user_payments FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.payment_submissions (
  id TEXT PRIMARY KEY,
  user_id UUID,
  payload JSONB,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access payment_submissions" ON public.payment_submissions FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.payment_reviews (
  id TEXT PRIMARY KEY,
  submission_id TEXT,
  admin_id UUID,
  review_notes TEXT,
  status TEXT,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payment_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access payment_reviews" ON public.payment_reviews FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY,
  profile_settings JSONB,
  preferences JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access user_settings" ON public.user_settings FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.system_settings (
  id TEXT PRIMARY KEY,
  config_key TEXT UNIQUE,
  config_value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access system_settings" ON public.system_settings FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.download_records (
  id TEXT PRIMARY KEY,
  user_id UUID,
  service TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Ready',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.download_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access download_records" ON public.download_records FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access audit_logs" ON public.audit_logs FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY,
  role TEXT DEFAULT 'user',
  permissions JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access user_roles" ON public.user_roles FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.manual_requests (
  id TEXT PRIMARY KEY,
  user_id UUID,
  full_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  normal_call_number TEXT NOT NULL,
  service_name TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.manual_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access manual_requests" ON public.manual_requests FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.passkeys (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user',
  active BOOLEAN DEFAULT TRUE,
  created_date TEXT,
  created_at_timestamp BIGINT,
  created_by TEXT,
  description TEXT,
  last_used TEXT,
  total_usages INTEGER DEFAULT 1,
  used_usages INTEGER DEFAULT 0,
  remaining_usages INTEGER DEFAULT 1,
  payment_status TEXT DEFAULT 'ACTIVE',
  package_name TEXT,
  package_price TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.passkeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access passkeys" ON public.passkeys FOR ALL USING (true);
`;

// Helper: Upload Background to Supabase Storage
export async function uploadBackgroundToSupabase(file: File | Blob, filename: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const cleanFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { data, error } = await supabase.storage.from('backgrounds').upload(cleanFilename, file, {
      cacheControl: '3600',
      upsert: true,
    });
    if (error) {
      console.warn('Supabase storage upload warning:', error.message);
      return null;
    }
    const { data: publicUrlData } = supabase.storage.from('backgrounds').getPublicUrl(cleanFilename);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Upload background failed:', err);
    return null;
  }
}

// Helper: Save/Update Universal Template on Supabase
export async function saveUniversalTemplateSupabase(
  serviceType: string,
  template: any,
  isUniversalFront: boolean,
  isUniversalBack: boolean
): Promise<boolean> {
  if (!supabase) return false;
  try {
    // 1. Deactivate previous active version for this service_type & orientation
    const orientationTag = isUniversalBack ? 'back' : 'front';
    const matchTag = `${serviceType}_${orientationTag}`;

    await supabase
      .from('templates')
      .update({ is_active: false })
      .eq('service_type', serviceType)
      .eq('is_universal', true);

    // 2. Insert new active template record
    const { error } = await supabase.from('templates').upsert({
      id: template.id,
      service_type: serviceType,
      template_name: template.templateName || `${serviceType} ${orientationTag.toUpperCase()} Universal`,
      template_json: template,
      background_url: template.background?.src || null,
      is_universal: true,
      is_active: true,
      version: Date.now(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Supabase universal template save error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Failed to save universal template to Supabase:', e);
    return false;
  }
}

// Helper: Fetch Latest Active Universal Template from Supabase
export async function fetchActiveUniversalTemplateSupabase(serviceType: string, isBack: boolean): Promise<any | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('service_type', serviceType)
      .eq('is_universal', true)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0].template_json;
  } catch (e) {
    console.error('Error fetching universal template from Supabase:', e);
    return null;
  }
}

// Helper: Fetch All Active Templates from Supabase
export async function fetchAllActiveTemplatesSupabase(): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('is_active', true);
    if (error || !data) return [];
    return data.map((d: any) => d.template_json);
  } catch (e) {
    console.error('Error fetching all active templates from Supabase:', e);
    return [];
  }
}

// Helper: Sync Profile
export async function syncProfileSupabase(profile: {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  tokens: number;
  passkey?: string;
}): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('profiles').upsert({
      id: profile.id,
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      role: profile.role,
      passkey: profile.passkey,
      tokens: profile.tokens,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.warn('Sync profile warning:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Failed profile sync:', e);
    return false;
  }
}

// Helper: Fetch Profile
export async function fetchProfileSupabase(userId: string): Promise<any | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !data) return null;
    return data;
  } catch (e) {
    return null;
  }
}

// Helper: Sync/Upsert Passkey on Supabase
export async function syncPasskeySupabase(passkey: {
  id: string;
  key: string;
  role: string;
  active: boolean;
  createdDate?: string;
  createdAtTimestamp?: number;
  createdBy?: string;
  description?: string;
  lastUsed?: string;
  totalUsages?: number;
  usedUsages?: number;
  remainingUsages?: number;
  paymentStatus?: string;
  packageName?: string;
  packagePrice?: string;
}): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('passkeys').upsert({
      id: passkey.id,
      key: passkey.key,
      role: passkey.role,
      active: passkey.active,
      created_date: passkey.createdDate,
      created_at_timestamp: passkey.createdAtTimestamp,
      created_by: passkey.createdBy,
      description: passkey.description,
      last_used: passkey.lastUsed,
      total_usages: passkey.totalUsages ?? 1,
      used_usages: passkey.usedUsages ?? 0,
      remaining_usages: passkey.remainingUsages ?? 1,
      payment_status: passkey.paymentStatus ?? 'ACTIVE',
      package_name: passkey.packageName,
      package_price: passkey.packagePrice,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Sync passkey warning:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Failed passkey sync to Supabase:', e);
    return false;
  }
}

// Helper: Fetch All Passkeys from Supabase
export async function fetchPasskeysSupabase(): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data: passkeyData, error } = await supabase.from('passkeys').select('*');
    if (error || !passkeyData) return [];

    const list: any[] = [];
    passkeyData.forEach((p) => {
      list.push({
        id: p.id,
        key: p.key,
        role: p.role || 'user',
        active: p.active !== false && p.payment_status !== 'DISABLED',
        createdDate: p.created_date || new Date(p.created_at || Date.now()).toISOString().replace('T', ' ').substring(0, 16),
        createdAtTimestamp: p.created_at_timestamp || Date.now(),
        createdBy: p.created_by || 'Supabase',
        description: p.description || 'Supabase Passkey',
        lastUsed: p.last_used,
        totalUsages: p.total_usages ?? (p.role === 'admin' ? 99999 : 1),
        usedUsages: p.used_usages ?? 0,
        remainingUsages: p.remaining_usages ?? (p.role === 'admin' ? 99999 : 1),
        paymentStatus: p.payment_status || 'ACTIVE',
        packageName: p.package_name || (p.role === 'admin' ? 'Unlimited Admin' : '1 Usage Package'),
        packagePrice: p.package_price || 'Free',
        usageHistory: [],
      });
    });

    return list;
  } catch (e) {
    console.error('Failed to fetch passkeys from Supabase:', e);
    return [];
  }
}

// Helper: Query Passkey directly by Key from Supabase (Canonical Source: passkeys.key & profiles.passkey)
export async function fetchPasskeyByKeySupabase(inputKey: string): Promise<any | null> {
  if (!supabase || !inputKey) return null;
  const trimmed = inputKey.trim();
  try {
    // 1. Check passkeys table
    const { data: passkeys, error } = await supabase
      .from('passkeys')
      .select('*')
      .ilike('key', trimmed)
      .limit(1);

    if (passkeys && passkeys.length > 0) {
      const p = passkeys[0];
      if (p.active === false || p.payment_status === 'DISABLED') {
        return null;
      }
      return {
        id: p.id,
        key: p.key,
        role: p.role || 'user',
        active: p.active !== false,
        createdDate: p.created_date || new Date(p.created_at || Date.now()).toISOString().replace('T', ' ').substring(0, 16),
        createdAtTimestamp: p.created_at_timestamp || Date.now(),
        createdBy: p.created_by || 'Supabase',
        description: p.description || 'Supabase Passkey',
        lastUsed: p.last_used,
        totalUsages: p.total_usages ?? (p.role === 'admin' ? 99999 : 1),
        usedUsages: p.used_usages ?? 0,
        remainingUsages: p.remaining_usages ?? (p.role === 'admin' ? 99999 : 1),
        paymentStatus: p.payment_status || 'ACTIVE',
        packageName: p.package_name || (p.role === 'admin' ? 'Unlimited Admin' : '1 Usage Package'),
        packagePrice: p.package_price || 'Free',
        usageHistory: [],
      };
    }

    // 2. Fallback check profiles table
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .ilike('passkey', trimmed)
      .limit(1);

    if (!profErr && profiles && profiles.length > 0) {
      const prof = profiles[0];
      if (prof.status === 'DISABLED') return null;
      return {
        id: `pk_prof_${prof.id}`,
        key: prof.passkey,
        role: prof.role || 'user',
        active: true,
        createdDate: new Date(prof.created_at || Date.now()).toISOString().replace('T', ' ').substring(0, 16),
        createdAtTimestamp: new Date(prof.created_at || Date.now()).getTime(),
        createdBy: prof.name || 'User',
        description: `Profile Passkey: ${prof.name} (${prof.phone})`,
        totalUsages: 1,
        usedUsages: 0,
        remainingUsages: 1,
        paymentStatus: 'ACTIVE',
        packageName: 'Standard User Package',
        packagePrice: 'Free',
        usageHistory: [],
      };
    }

    return null;
  } catch (e) {
    console.error('Error querying passkey from Supabase:', e);
    return null;
  }
}

// Helper: Delete Passkey on Supabase
export async function deletePasskeySupabase(id?: string, key?: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    if (id) {
      await supabase.from('passkeys').delete().eq('id', id);
    }
    if (key) {
      await supabase.from('passkeys').delete().eq('key', key);
    }
    return true;
  } catch (e) {
    console.error('Failed to delete passkey from Supabase:', e);
    return false;
  }
}

// Helper: Recover / Reset Passkey by Phone Number
export async function recoverPasskeyByPhoneSupabase(phoneInput: string, newPasskey: string): Promise<{ success: boolean; message: string; fullName?: string }> {
  if (!supabase) return { success: false, message: 'Backend database not initialized' };
  const rawPhone = phoneInput.trim().replace(/\s+/g, '');
  const trimmedKey = newPasskey.trim();
  if (!rawPhone || !trimmedKey) {
    return { success: false, message: 'Please provide both phone number and new passkey' };
  }

  try {
    // 1. Check profiles table
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', rawPhone)
      .limit(1);

    if (profiles && profiles.length > 0) {
      const prof = profiles[0];
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ passkey: trimmedKey, updated_at: new Date().toISOString() })
        .eq('id', prof.id);

      if (updateErr) {
        return { success: false, message: updateErr.message || 'Failed to update passkey in backend' };
      }

      return { success: true, message: 'Passkey successfully recovered and updated', fullName: prof.name };
    }

    // 2. Check passkeys table by description containing phone
    const { data: passkeys } = await supabase
      .from('passkeys')
      .select('*')
      .ilike('description', `%${rawPhone}%`)
      .limit(1);

    if (passkeys && passkeys.length > 0) {
      const pk = passkeys[0];
      const { error: pkErr } = await supabase
        .from('passkeys')
        .update({ key: trimmedKey })
        .eq('id', pk.id);

      if (pkErr) {
        return { success: false, message: pkErr.message || 'Failed to update passkey' };
      }

      return { success: true, message: 'Passkey successfully recovered and updated', fullName: pk.created_by || 'User' };
    }

    return { success: false, message: 'No registered account found with this phone number' };
  } catch (e: any) {
    console.error('Error recovering passkey:', e);
    return { success: false, message: e.message || 'Failed to recover passkey' };
  }
}


