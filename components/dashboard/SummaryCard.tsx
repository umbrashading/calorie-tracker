import type { DailySummary } from "@/lib/types/database";
import { formatNetCalories, netCalorieTone } from "@/lib/calc/summary";

interface SummaryCardProps {
  summary: DailySummary;
  isCurrentUser: boolean;
}

export function SummaryCard({ summary, isCurrentUser }: SummaryCardProps) {
  const tone = netCalorieTone(summary.net_calories);
  const isLive = summary.is_live ?? false;

  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            {summary.avatar_emoji}
          </span>
          <div>
            <h2 className="font-semibold">{summary.display_name ?? "Unnamed"}</h2>
            {isCurrentUser ? (
              <p className="text-xs text-neutral-500">You</p>
            ) : null}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Net</p>
          <p
            className={`text-2xl font-bold tabular-nums ${
              tone === "surplus"
                ? "text-red-600"
                : tone === "deficit"
                  ? "text-emerald-600"
                  : "text-neutral-900"
            }`}
          >
            {formatNetCalories(summary.net_calories)}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-neutral-500">In</dt>
          <dd className="font-semibold tabular-nums">{summary.calories_in} kcal</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Out</dt>
          <dd className="font-semibold tabular-nums">
            {summary.calories_out_total ?? "—"} kcal
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500">{isLive ? "Resting (so far)" : "Resting"}</dt>
          <dd className="tabular-nums">{summary.baseline_calories ?? "—"} kcal</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Exercise</dt>
          <dd className="tabular-nums">{summary.exercise_calories} kcal</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-neutral-500">Steps</dt>
          <dd className="tabular-nums">
            {summary.steps.toLocaleString()} ({summary.steps_calories} kcal)
          </dd>
        </div>
      </dl>
    </article>
  );
}
