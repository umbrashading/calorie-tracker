import { computeBaselineCalories } from "@/lib/calc/bmr";
import { computeStepsCalorieOffset, DEFAULT_AVERAGE_DAILY_STEPS } from "@/lib/calc/steps";
import type { DailySummary, Profile } from "@/lib/types/database";
import { getDayFraction, todayInTimezone } from "@/lib/utils/date";

export interface BuildDailySummaryInput {
  profile: Profile;
  entryDate: string;
  caloriesIn: number;
  exerciseCalories: number;
  enteredSteps: number | null;
  hasStepsEntry: boolean;
  now?: Date;
}

export function computeProratedBaseline(
  fullDayBaseline: number | null,
  dayFraction: number,
  isLiveDay: boolean
): number | null {
  if (fullDayBaseline == null) {
    return null;
  }

  if (!isLiveDay) {
    return fullDayBaseline;
  }

  return Math.round(fullDayBaseline * dayFraction);
}

export function buildDailySummary(input: BuildDailySummaryInput): DailySummary {
  const { profile, entryDate, caloriesIn, exerciseCalories, enteredSteps, hasStepsEntry } =
    input;
  const now = input.now ?? new Date();
  const timezone = profile.timezone ?? "UTC";
  const today = todayInTimezone(timezone, now);
  const isLiveDay = entryDate === today;
  const dayFraction = isLiveDay ? getDayFraction(timezone, now) : 1;
  const averageDailySteps = profile.average_daily_steps ?? DEFAULT_AVERAGE_DAILY_STEPS;

  const fullBaseline = computeBaselineCalories(profile);
  const baselineCalories = computeProratedBaseline(fullBaseline, dayFraction, isLiveDay);
  const stepsCalories = computeStepsCalorieOffset(
    enteredSteps,
    averageDailySteps,
    profile.weight_kg,
    dayFraction,
    isLiveDay,
    hasStepsEntry
  );

  const steps = hasStepsEntry
    ? (enteredSteps ?? 0)
    : isLiveDay
      ? Math.round(averageDailySteps * dayFraction)
      : averageDailySteps;

  const caloriesOutTotal =
    baselineCalories != null ? baselineCalories + stepsCalories + exerciseCalories : null;
  const netCalories =
    caloriesOutTotal != null ? caloriesIn - caloriesOutTotal : null;

  return {
    user_id: profile.id,
    entry_date: entryDate,
    display_name: profile.display_name,
    avatar_emoji: profile.avatar_emoji,
    calories_in: caloriesIn,
    baseline_calories: baselineCalories,
    steps,
    steps_calories: stepsCalories,
    exercise_calories: exerciseCalories,
    calories_out_total: caloriesOutTotal,
    net_calories: netCalories,
    is_live: isLiveDay,
  };
}

export function formatNetCalories(net: number | null): string {
  if (net == null) return "—";
  if (net > 0) return `+${net}`;
  return String(net);
}

export function formatSignedCalories(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

export function netCalorieTone(net: number | null): "neutral" | "surplus" | "deficit" {
  if (net == null || net === 0) return "neutral";
  return net > 0 ? "surplus" : "deficit";
}

export function sortSummariesByDisplayName(summaries: DailySummary[]): DailySummary[] {
  return [...summaries].sort((left, right) => {
    const leftName = left.display_name ?? "";
    const rightName = right.display_name ?? "";
    return leftName.localeCompare(rightName);
  });
}
