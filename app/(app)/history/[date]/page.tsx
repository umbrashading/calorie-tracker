import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { sortSummariesByDisplayName } from "@/lib/calc/summary";
import type {
  BurnEntry,
  DailySummary,
  IntakeEntry,
} from "@/lib/types/database";
import { formatDisplayDate, utcRangeForLocalDate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function HistoryDayPage({ params }: { params: { date: string } }) {
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
  const { startIso, endIso } = utcRangeForLocalDate(params.date, timezone);

  const [{ data: summaryData }, { data: intakeData }, { data: burnData }] = await Promise.all([
    supabase.from("daily_summary").select("*").eq("entry_date", params.date),
    supabase
      .from("intake_entries")
      .select("*")
      .gte("logged_at", startIso)
      .lt("logged_at", endIso)
      .order("logged_at", { ascending: false }),
    supabase
      .from("burn_entries")
      .select("*")
      .gte("logged_at", startIso)
      .lt("logged_at", endIso)
      .order("logged_at", { ascending: false }),
  ]);

  const summaries = sortSummariesByDisplayName((summaryData ?? []) as DailySummary[]);
  const intakeEntries = (intakeData ?? []) as IntakeEntry[];
  const burnEntries = (burnData ?? []) as BurnEntry[];

  return (
    <main className="space-y-6 p-4">
      <div>
        <Link href="/history" className="text-sm text-neutral-600 underline">
          ← Back to history
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{formatDisplayDate(params.date)}</h1>
        <p className="mt-1 text-sm text-neutral-600">{params.date}</p>
      </div>

      {summaries.length ? (
        <section className="space-y-4">
          {summaries.map((summary) => (
            <SummaryCard
              key={summary.user_id}
              summary={summary}
              isCurrentUser={summary.user_id === user?.id}
            />
          ))}
        </section>
      ) : (
        <p className="text-sm text-neutral-600">No summary for this day.</p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Intake entries</h2>
        {intakeEntries.length ? (
          <ul className="space-y-2">
            {intakeEntries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{entry.description}</p>
                    {entry.assumptions ? (
                      <p className="mt-1 text-neutral-500">{entry.assumptions}</p>
                    ) : null}
                  </div>
                  <p className="font-semibold tabular-nums">{entry.calories} kcal</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">No intake logged.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Burn entries</h2>
        {burnEntries.length ? (
          <ul className="space-y-2">
            {burnEntries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{entry.description}</p>
                    {entry.assumptions ? (
                      <p className="mt-1 text-neutral-500">{entry.assumptions}</p>
                    ) : null}
                  </div>
                  <p className="font-semibold tabular-nums">{entry.calories} kcal</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">No exercise logged.</p>
        )}
      </section>
    </main>
  );
}
