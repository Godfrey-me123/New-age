// Public client credentials (publishable key is designed to be shipped in client apps; access is enforced by RLS).
// Bundled so APK/offline builds without a .env still connect to the shared cloud database.
export const SUPABASE_PUBLIC_URL = "https://yjnvjuouxzfrhlqzstlp.supabase.co";
export const SUPABASE_PUBLIC_ANON_KEY = "REPLACE_WITH_NEW_PROJECT_ANON_KEY";
