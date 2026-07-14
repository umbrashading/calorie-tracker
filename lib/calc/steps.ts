export function stepsToCalories(steps: number, weightKg: number | null): number {
  return Math.round(steps * 0.0005 * (weightKg ?? 0));
}
