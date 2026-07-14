import { NextResponse } from "next/server";
import { estimateBurn } from "@/lib/claude/burn";
import { createClient } from "@/lib/supabase/server";
import type { BurnChatRequest } from "@/lib/types/chat";
import type { Profile } from "@/lib/types/database";
import { isAuthError, requireUser } from "@/lib/utils/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await requireUser();
  if (isAuthError(user)) return user;

  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 503 }
    );
  }

  let body: BurnChatRequest;
  try {
    body = (await request.json()) as BurnChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, newUserMessage } = body;
  if (!newUserMessage?.trim()) {
    return NextResponse.json({ error: "newUserMessage is required" }, { status: 400 });
  }

  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "messages must be an array" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, age, sex, height_cm, weight_kg, average_daily_steps")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const profile = profileData as Pick<
    Profile,
    "display_name" | "age" | "sex" | "height_cm" | "weight_kg" | "average_daily_steps"
  > | null;

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  try {
    const { response, raw } = await estimateBurn(profile, messages, newUserMessage.trim());
    return NextResponse.json({ ...response, rawModelResponse: raw });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Claude request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
