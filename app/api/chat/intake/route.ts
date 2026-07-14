import { NextResponse } from "next/server";
import { estimateIntake } from "@/lib/claude/intake";
import { isAllowedImageMediaType, uploadMealPhoto } from "@/lib/supabase/storage";
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

  const { messages, newUserMessage, imageBase64, imageMediaType } = body;
  if (!newUserMessage?.trim() && !imageBase64) {
    return NextResponse.json(
      { error: "newUserMessage or an image is required" },
      { status: 400 }
    );
  }

  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "messages must be an array" }, { status: 400 });
  }

  if (imageBase64 && !imageMediaType) {
    return NextResponse.json(
      { error: "imageMediaType is required when imageBase64 is provided" },
      { status: 400 }
    );
  }

  if (imageMediaType && !isAllowedImageMediaType(imageMediaType)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  try {
    let imagePath: string | undefined;

    if (imageBase64 && imageMediaType) {
      imagePath = await uploadMealPhoto(user.id, imageBase64, imageMediaType);
    }

    const { response, raw } = await estimateIntake(
      messages,
      newUserMessage?.trim() ?? "",
      imageBase64 && imageMediaType
        ? { base64: imageBase64, mediaType: imageMediaType }
        : undefined
    );

    return NextResponse.json({
      ...response,
      imagePath,
      rawModelResponse: raw,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Claude request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
