import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SaveIntakeEntryRequest } from "@/lib/types/chat";
import type { Confidence } from "@/lib/types/database";
import { isAuthError, requireUser } from "@/lib/utils/auth";
import { utcRangeForLocalDate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

const VALID_CONFIDENCE: Confidence[] = ["high", "medium", "low"];

export async function GET(request: Request) {
  const user = await requireUser();
  if (isAuthError(user)) return user;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100);
  const date = searchParams.get("date");

  const supabase = await createClient();
  let query = supabase
    .from("intake_entries")
    .select("*")
    .order("logged_at", { ascending: false })
    .limit(limit);

  if (date) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .maybeSingle();

    const timezone = (profileData as { timezone?: string } | null)?.timezone ?? "UTC";
    const { startIso, endIso } = utcRangeForLocalDate(date, timezone);
    query = query.gte("logged_at", startIso).lt("logged_at", endIso);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (isAuthError(user)) return user;

  let body: SaveIntakeEntryRequest;
  try {
    body = (await request.json()) as SaveIntakeEntryRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { description, calories, confidence, assumptions, image_path, logged_at, raw_model_response } =
    body;

  if (!description?.trim()) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  if (typeof calories !== "number" || calories < 0 || !Number.isInteger(calories)) {
    return NextResponse.json({ error: "calories must be a non-negative integer" }, { status: 400 });
  }

  if (!VALID_CONFIDENCE.includes(confidence)) {
    return NextResponse.json({ error: "confidence must be high, medium, or low" }, { status: 400 });
  }

  const supabase = await createClient();
  const insertRow = {
    user_id: user.id,
    description: description.trim(),
    calories,
    confidence,
    assumptions: assumptions?.trim() ?? null,
    image_path: image_path ?? null,
    logged_at: logged_at ?? new Date().toISOString(),
    raw_model_response: raw_model_response ?? null,
  };

  const { data, error } = await supabase
    .from("intake_entries")
    .insert(insertRow as never)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entry: data }, { status: 201 });
}
