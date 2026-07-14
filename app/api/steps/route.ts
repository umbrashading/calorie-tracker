import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAuthError, requireUser } from "@/lib/utils/auth";
import { todayInTimezone } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await requireUser();
  if (isAuthError(user)) return user;

  let body: { steps?: number; entry_date?: string };
  try {
    body = (await request.json()) as { steps?: number; entry_date?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { steps, entry_date } = body;

  if (typeof steps !== "number" || steps < 0 || !Number.isInteger(steps)) {
    return NextResponse.json({ error: "steps must be a non-negative integer" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: profileData } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();

  const timezone = (profileData as { timezone?: string } | null)?.timezone ?? "UTC";
  const date = entry_date ?? todayInTimezone(timezone);

  const row = {
    user_id: user.id,
    entry_date: date,
    steps,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("daily_steps")
    .upsert(row as never, { onConflict: "user_id,entry_date" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ steps: data });
}
