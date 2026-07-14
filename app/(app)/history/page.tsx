import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HistoryWeekList } from "@/components/history/HistoryWeekList";
import type { DailySummary } from "@/lib/types/database";
import { addDays, endOfWeek, startOfWeek, todayInTimezone } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const timezone = (profileData as { timezone?: string } | null)?.timezone ?? "UTC";
  const anchorDate = searchParams.week ?? todayInTimezone(timezone);
  const weekStart = startOfWeek(anchorDate);
  const weekEnd = endOfWeek(anchorDate);

  const { data: summaryData } = await supabase
    .from("daily_summary")
    .select("*")
    .gte("entry_date", weekStart)
    .lte("entry_date", weekEnd)
    .order("entry_date", { ascending: false });

  const summaries = (summaryData ?? []) as DailySummary[];
  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);
  const nextWeekStart = startOfWeek(nextWeek);
  const showNext = nextWeekStart <= todayInTimezone(timezone);

  return (
    <main className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">History</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {weekStart} — {weekEnd}
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/history?week=${prevWeek}`}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          >
            ← Prev
          </Link>
          {showNext ? (
            <Link
              href={`/history?week=${nextWeek}`}
              className="rounded-lg border border-neutral-300 px-3 py-2"
            >
              Next →
            </Link>
          ) : null}
        </div>
      </div>

      <HistoryWeekList weekStart={weekStart} weekEnd={weekEnd} summaries={summaries} />
    </main>
  );
}
