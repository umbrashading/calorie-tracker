import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ActivityLevel, Profile, Sex } from "@/lib/types/database";
import { isAuthError, requireUser } from "@/lib/utils/auth";

export const dynamic = "force-dynamic";

const VALID_SEX: Sex[] = ["male", "female"];
const VALID_ACTIVITY: ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
];

export async function GET() {
  const user = await requireUser();
  if (isAuthError(user)) return user;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile: data });
}

export async function PATCH(request: Request) {
  const user = await requireUser();
  if (isAuthError(user)) return user;

  let body: Partial<Profile>;
  try {
    body = (await request.json()) as Partial<Profile>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.display_name !== undefined) {
    updates.display_name = body.display_name?.trim() || null;
  }

  if (body.avatar_emoji !== undefined) {
    updates.avatar_emoji = body.avatar_emoji?.trim() || "🙂";
  }

  if (body.age !== undefined) {
    if (body.age != null && (body.age < 10 || body.age > 120)) {
      return NextResponse.json({ error: "age must be between 10 and 120" }, { status: 400 });
    }
    updates.age = body.age;
  }

  if (body.sex !== undefined) {
    if (body.sex != null && !VALID_SEX.includes(body.sex)) {
      return NextResponse.json({ error: "sex must be male or female" }, { status: 400 });
    }
    updates.sex = body.sex;
  }

  if (body.height_cm !== undefined) {
    if (body.height_cm != null && body.height_cm <= 0) {
      return NextResponse.json({ error: "height_cm must be positive" }, { status: 400 });
    }
    updates.height_cm = body.height_cm;
  }

  if (body.weight_kg !== undefined) {
    if (body.weight_kg != null && body.weight_kg <= 0) {
      return NextResponse.json({ error: "weight_kg must be positive" }, { status: 400 });
    }
    updates.weight_kg = body.weight_kg;
  }

  if (body.activity_level !== undefined) {
    if (!VALID_ACTIVITY.includes(body.activity_level)) {
      return NextResponse.json({ error: "Invalid activity_level" }, { status: 400 });
    }
    updates.activity_level = body.activity_level;
  }

  if (body.daily_calorie_target !== undefined) {
    if (
      body.daily_calorie_target != null &&
      (body.daily_calorie_target < 500 || body.daily_calorie_target > 10000)
    ) {
      return NextResponse.json(
        { error: "daily_calorie_target must be between 500 and 10000" },
        { status: 400 }
      );
    }
    updates.daily_calorie_target = body.daily_calorie_target;
  }

  if (body.timezone !== undefined) {
    if (!body.timezone?.trim()) {
      return NextResponse.json({ error: "timezone is required" }, { status: 400 });
    }
    updates.timezone = body.timezone.trim();
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates as never)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
