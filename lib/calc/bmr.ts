import type { ActivityLevel, Profile, Sex } from "@/lib/types/database";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function computeBmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  if (sex === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }

  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

export function computeBaselineCalories(
  profile: Pick<Profile, "sex" | "weight_kg" | "height_cm" | "age" | "activity_level">
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
  const multiplier = ACTIVITY_MULTIPLIERS[profile.activity_level];
  return Math.round(bmr * multiplier);
}

export function getActivityMultiplier(activityLevel: ActivityLevel): number {
  return ACTIVITY_MULTIPLIERS[activityLevel];
}
