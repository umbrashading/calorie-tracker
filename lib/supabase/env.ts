export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "") ?? "";
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
}

export function hasSupabaseEnv() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(url && key && url.includes(".supabase.co"));
}

export function getSupabaseConfigError(): string | null {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url && !key) {
    return "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set in Vercel.";
  }
  if (!url) {
    return "NEXT_PUBLIC_SUPABASE_URL is not set in Vercel.";
  }
  if (!key) {
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in Vercel.";
  }
  if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    return "NEXT_PUBLIC_SUPABASE_URL should look like https://your-project-ref.supabase.co";
  }
  if (!key.startsWith("eyJ")) {
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY should be the anon/public key (starts with eyJ), not the service role key.";
  }
  return null;
}
