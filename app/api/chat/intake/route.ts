import { NextResponse } from "next/server";
import { estimateIntake } from "@/lib/claude/intake";
import type { IntakeChatRequest } from "@/lib/types/chat";
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

  let body: IntakeChatRequest;
  try {
    body = (await request.json()) as IntakeChatRequest;
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

  try {
    const { response, raw } = await estimateIntake(messages, newUserMessage.trim());
    return NextResponse.json({ ...response, rawModelResponse: raw });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Claude request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
