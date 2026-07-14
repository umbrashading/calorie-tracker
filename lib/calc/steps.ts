export const DEFAULT_AVERAGE_DAILY_STEPS = 8000;
export const CALORIES_PER_STEP_PER_KG = 0.0005;

export function stepsToCalorieOffset(
  actualSteps: number,
  expectedSteps: number,
  weightKg: number | null
): number {
  const deltaSteps = actualSteps - expectedSteps;
  return Math.round(deltaSteps * CALORIES_PER_STEP_PER_KG * (weightKg ?? 0));
}

export function expectedStepsAtTime(averageDailySteps: number, dayFraction: number): number {
  return Math.round(averageDailySteps * dayFraction);
}

export function resolveActualSteps(
  enteredSteps: number | null,
  averageDailySteps: number,
  dayFraction: number,
  isLiveDay: boolean,
  hasStepsEntry: boolean
): number {
  if (hasStepsEntry && enteredSteps != null) {
    return enteredSteps;
  }

  if (isLiveDay) {
    return expectedStepsAtTime(averageDailySteps, dayFraction);
  }

  return averageDailySteps;
}

export function computeStepsCalorieOffset(
  enteredSteps: number | null,
  averageDailySteps: number,
  weightKg: number | null,
  dayFraction: number,
  isLiveDay: boolean,
  hasStepsEntry: boolean
): number {
  const average = averageDailySteps || DEFAULT_AVERAGE_DAILY_STEPS;
  const expectedSteps = isLiveDay
    ? expectedStepsAtTime(average, dayFraction)
    : average;
  const actualSteps = resolveActualSteps(
    enteredSteps,
    average,
    dayFraction,
    isLiveDay,
    hasStepsEntry
  );

  return stepsToCalorieOffset(actualSteps, expectedSteps, weightKg);
}
