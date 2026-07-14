import { NextResponse } from "next/server";
import {
  getSupabaseConfigError,
  getSupabaseUrl,
  hasSupabaseEnv,
} from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const configError = getSupabaseConfigError();

  if (configError) {
    return NextResponse.json({ ok: false, error: configError });
  }

  const url = getSupabaseUrl();

  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      cache: "no-store",
    });

    return NextResponse.json({
      ok: response.ok,
      configured: hasSupabaseEnv(),
      projectHost: new URL(url).host,
      authReachable: response.ok,
      hint: response.ok
        ? "Supabase is reachable. If login still fails, check the user exists in Supabase Auth and redeploy after changing env vars."
        : "Supabase auth endpoint returned an error. Check your anon key matches this project.",
    });
  } catch {
    return NextResponse.json({
      ok: false,
      configured: hasSupabaseEnv(),
      projectHost: url ? new URL(url).host : null,
      authReachable: false,
      error: "Could not reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL in Vercel and redeploy.",
    });
  }
}
