import Link from "next/link";
import type { DailySummary } from "@/lib/types/database";
import { formatDisplayDate, formatShortDate } from "@/lib/utils/date";

interface HistoryWeekListProps {
  weekStart: string;
  weekEnd: string;
  summaries: DailySummary[];
}

export function HistoryWeekList({ weekStart, weekEnd, summaries }: HistoryWeekListProps) {
  const datesInWeek: string[] = [];
  let cursor = weekStart;
  while (cursor <= weekEnd) {
    datesInWeek.push(cursor);
    const next = new Date(`${cursor}T12:00:00`);
    next.setDate(next.getDate() + 1);
    cursor = next.toISOString().slice(0, 10);
  }

  const summariesByDate = new Map<string, DailySummary[]>();
  for (const summary of summaries) {
    const existing = summariesByDate.get(summary.entry_date) ?? [];
    existing.push(summary);
    summariesByDate.set(summary.entry_date, existing);
  }

  return (
    <ul className="space-y-3">
      {datesInWeek.reverse().map((date) => {
        const daySummaries = summariesByDate.get(date) ?? [];

        return (
          <li key={date}>
            <Link
              href={`/history/${date}`}
              className="block rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{formatDisplayDate(date)}</p>
                  <p className="text-sm text-neutral-500">{formatShortDate(date)}</p>
                </div>
                <div className="text-right text-sm">
                  {daySummaries.length ? (
                    <ul className="space-y-1">
                      {daySummaries.map((summary) => (
                        <li key={summary.user_id} className="flex items-center justify-end gap-2">
                          <span aria-hidden>{summary.avatar_emoji}</span>
                          <span className="tabular-nums">
                            {summary.net_calories != null
                              ? `${summary.net_calories > 0 ? "+" : ""}${summary.net_calories}`
                              : "—"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-neutral-400">No entries</span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
