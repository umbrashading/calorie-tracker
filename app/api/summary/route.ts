import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DailySummary } from "@/lib/types/database";
import { isAuthError, requireUser } from "@/lib/utils/auth";
import { todayInTimezone } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireUser();
  if (isAuthError(user)) return user;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = await createClient();
  const { data: profileData } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();

  const timezone = (profileData as { timezone?: string } | null)?.timezone ?? "UTC";

  let query = supabase.from("daily_summary").select("*").order("entry_date", { ascending: false });

  if (date) {
    query = query.eq("entry_date", date);
  } else if (from && to) {
    query = query.gte("entry_date", from).lte("entry_date", to);
  } else {
    query = query.eq("entry_date", todayInTimezone(timezone));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ summaries: (data ?? []) as DailySummary[] });
}
