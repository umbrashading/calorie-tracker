import type { SupabaseClient } from "@supabase/supabase-js";
import { buildDailySummary, sortSummariesByDisplayName } from "@/lib/calc/summary";
import type { DailySummary, Database, Profile } from "@/lib/types/database";
import { addDays, todayInTimezone, utcRangeForLocalDate } from "@/lib/utils/date";

export async function fetchSummariesForDate(
  supabase: SupabaseClient<Database>,
  entryDate: string,
  options: {
    includeAllProfiles?: boolean;
    referenceTimezone?: string;
    now?: Date;
  } = {}
): Promise<DailySummary[]> {
  const now = options.now ?? new Date();

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .order("display_name");

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profiles = (profilesData ?? []) as Profile[];
  if (!profiles.length) {
    return [];
  }

  const referenceTimezone =
    options.referenceTimezone ?? profiles.find((profile) => profile.id)?.timezone ?? "UTC";
  const today = todayInTimezone(referenceTimezone, now);
  const includeAllProfiles = options.includeAllProfiles ?? entryDate === today;

  const summaries: DailySummary[] = [];

  for (const profile of profiles) {
    const timezone = profile.timezone ?? "UTC";
    const { startIso, endIso } = utcRangeForLocalDate(entryDate, timezone);

    const [intakeResult, burnResult, stepsResult] = await Promise.all([
      supabase
        .from("intake_entries")
        .select("calories")
        .eq("user_id", profile.id)
        .gte("logged_at", startIso)
        .lt("logged_at", endIso),
      supabase
        .from("burn_entries")
        .select("calories")
        .eq("user_id", profile.id)
        .gte("logged_at", startIso)
        .lt("logged_at", endIso),
      supabase
        .from("daily_steps")
        .select("steps")
        .eq("user_id", profile.id)
        .eq("entry_date", entryDate)
        .maybeSingle(),
    ]);

    if (intakeResult.error) throw new Error(intakeResult.error.message);
    if (burnResult.error) throw new Error(burnResult.error.message);
    if (stepsResult.error) throw new Error(stepsResult.error.message);

    const intakeRows = (intakeResult.data ?? []) as Array<{ calories: number }>;
    const burnRows = (burnResult.data ?? []) as Array<{ calories: number }>;

    const caloriesIn = intakeRows.reduce((total, entry) => total + entry.calories, 0);
    const exerciseCalories = burnRows.reduce((total, entry) => total + entry.calories, 0);
    const stepsRow = stepsResult.data as { steps: number } | null;
    const hasStepsEntry = stepsRow != null;
    const enteredSteps = hasStepsEntry ? stepsRow.steps : null;
    const hasActivity = caloriesIn > 0 || exerciseCalories > 0 || hasStepsEntry;

    if (!includeAllProfiles && !hasActivity) {
      continue;
    }

    summaries.push(
      buildDailySummary({
        profile,
        entryDate,
        caloriesIn,
        exerciseCalories,
        enteredSteps,
        hasStepsEntry,
        now,
      })
    );
  }

  return sortSummariesByDisplayName(summaries);
}

export async function fetchSummariesForRange(
  supabase: SupabaseClient<Database>,
  from: string,
  to: string,
  options: { referenceTimezone?: string; now?: Date } = {}
): Promise<DailySummary[]> {
  const summaries: DailySummary[] = [];
  let cursor = from;

  while (cursor <= to) {
    const daySummaries = await fetchSummariesForDate(supabase, cursor, {
      referenceTimezone: options.referenceTimezone,
      now: options.now,
    });
    summaries.push(...daySummaries);
    cursor = addDays(cursor, 1);
  }

  return summaries;
}
