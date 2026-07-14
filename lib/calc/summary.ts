import { computeRestingBaseline } from "@/lib/calc/bmr";
import {
  computeStepsCalories,
  DEFAULT_AVERAGE_DAILY_STEPS,
  resolveStepsForCalculation,
} from "@/lib/calc/steps";
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

export function computeProratedRestingBaseline(
  fullDayRestingBaseline: number | null,
  dayFraction: number,
  isLiveDay: boolean
): number | null {
  if (fullDayRestingBaseline == null) {
    return null;
  }

  if (!isLiveDay) {
    return fullDayRestingBaseline;
  }

  return Math.round(fullDayRestingBaseline * dayFraction);
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

  const fullRestingBaseline = computeRestingBaseline(profile);
  const baselineCalories = computeProratedRestingBaseline(
    fullRestingBaseline,
    dayFraction,
    isLiveDay
  );
  const steps = resolveStepsForCalculation(
    enteredSteps,
    averageDailySteps,
    dayFraction,
    isLiveDay,
    hasStepsEntry
  );
  const stepsCalories = computeStepsCalories(
    enteredSteps,
    averageDailySteps,
    profile.weight_kg,
    dayFraction,
    isLiveDay,
    hasStepsEntry
  );

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
