import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv } from "@/lib/supabase/env";

export function createClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}

export { hasSupabaseEnv };
