import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchSummariesForDate } from "@/lib/calc/fetch-summaries";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { StepsInput } from "@/components/dashboard/StepsInput";
import type { DailySteps } from "@/lib/types/database";
import { todayInTimezone } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
  const today = todayInTimezone(timezone);

  const summaries = await fetchSummariesForDate(supabase, today, {
    includeAllProfiles: true,
    referenceTimezone: timezone,
  });

  const { data: stepsData } = await supabase
    .from("daily_steps")
    .select("steps")
    .eq("user_id", user?.id ?? "")
    .eq("entry_date", today)
    .maybeSingle();

  const steps = (stepsData as Pick<DailySteps, "steps"> | null)?.steps ?? 0;

  return (
    <main className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Today</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Household calorie balance for {today}. Burn estimates prorate through the day; steps
          adjust above or below your average pace.
        </p>
      </div>

      <StepsInput initialSteps={steps} entryDate={today} />

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
        <section className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center">
          <p className="text-sm text-neutral-600">No household profiles found yet.</p>
          <div className="mt-4 flex justify-center gap-3 text-sm">
            <Link href="/log/intake" className="font-medium text-neutral-900 underline">
              Log intake
            </Link>
            <Link href="/log/burn" className="font-medium text-neutral-900 underline">
              Log burn
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
