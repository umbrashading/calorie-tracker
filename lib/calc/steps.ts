export const DEFAULT_AVERAGE_DAILY_STEPS = 8000;
export const CALORIES_PER_STEP_PER_KG = 0.0005;

export function stepsToCalories(steps: number, weightKg: number | null): number {
  return Math.round(steps * CALORIES_PER_STEP_PER_KG * (weightKg ?? 0));
}

export function resolveStepsForCalculation(
  enteredSteps: number | null,
  averageDailySteps: number,
  dayFraction: number,
  isLiveDay: boolean,
  hasStepsEntry: boolean
): number {
  if (hasStepsEntry && enteredSteps != null) {
    return enteredSteps;
  }

  const average = averageDailySteps || DEFAULT_AVERAGE_DAILY_STEPS;

  if (isLiveDay) {
    return Math.round(average * dayFraction);
  }

  return average;
}

export function computeStepsCalories(
  enteredSteps: number | null,
  averageDailySteps: number,
  weightKg: number | null,
  dayFraction: number,
  isLiveDay: boolean,
  hasStepsEntry: boolean
): number {
  const steps = resolveStepsForCalculation(
    enteredSteps,
    averageDailySteps,
    dayFraction,
    isLiveDay,
    hasStepsEntry
  );

  return stepsToCalories(steps, weightKg);
}
