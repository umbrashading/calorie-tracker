import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { canCreateClient, createClient } from "@/lib/supabase/server";

export async function getUser(): Promise<User | null> {
  if (!canCreateClient()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser(): Promise<User | NextResponse> {
  if (!canCreateClient()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  }

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export function isAuthError(result: User | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
