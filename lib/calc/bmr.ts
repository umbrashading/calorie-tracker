import type { Profile, Sex } from "@/lib/types/database";

/** Sedentary multiplier — everyday living excluding walking, which is covered by steps. */
export const RESTING_ACTIVITY_MULTIPLIER = 1.2;

export function computeBmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  if (sex === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }

  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

export function computeRestingBaseline(
  profile: Pick<Profile, "sex" | "weight_kg" | "height_cm" | "age">
): number | null {
  if (
    !profile.sex ||
    profile.weight_kg == null ||
    profile.height_cm == null ||
    profile.age == null
  ) {
    return null;
  }

  const bmr = computeBmr(profile.sex, profile.weight_kg, profile.height_cm, profile.age);
  return Math.round(bmr * RESTING_ACTIVITY_MULTIPLIER);
}

/** @deprecated Use computeRestingBaseline — activity level is no longer used in burn calculations. */
export function computeBaselineCalories(
  profile: Pick<Profile, "sex" | "weight_kg" | "height_cm" | "age">
): number | null {
  return computeRestingBaseline(profile);
}
