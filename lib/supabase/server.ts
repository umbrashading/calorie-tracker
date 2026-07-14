import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv } from "@/lib/supabase/env";

export async function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component where cookies cannot be set.
        }
      },
    },
  });
}

export function canCreateClient() {
  return hasSupabaseEnv();
}
