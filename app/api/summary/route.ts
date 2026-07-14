import { NextResponse } from "next/server";
import { fetchSummariesForDate, fetchSummariesForRange } from "@/lib/calc/fetch-summaries";
import { createClient } from "@/lib/supabase/server";
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

  try {
    if (date) {
      const summaries = await fetchSummariesForDate(supabase, date, {
        includeAllProfiles: date === todayInTimezone(timezone),
        referenceTimezone: timezone,
      });
      return NextResponse.json({ summaries });
    }

    if (from && to) {
      const summaries = await fetchSummariesForRange(supabase, from, to, {
        referenceTimezone: timezone,
      });
      return NextResponse.json({ summaries });
    }

    const today = todayInTimezone(timezone);
    const summaries = await fetchSummariesForDate(supabase, today, {
      includeAllProfiles: true,
      referenceTimezone: timezone,
    });
    return NextResponse.json({ summaries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load summaries";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
