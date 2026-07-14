import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages";
import { getAnthropicClient, getClaudeModelId } from "@/lib/claude/client";
import { INTAKE_SYSTEM_PROMPT } from "@/lib/claude/prompts";
import {
  IntakeClaudeResponseSchema,
  type IntakeClaudeResponse,
} from "@/lib/claude/schemas";
import type { ChatMessage, IntakeChatResponse } from "@/lib/types/chat";

type ImageInput = {
  base64: string;
  mediaType: string;
};

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export async function estimateIntake(
  history: ChatMessage[],
  newUserMessage: string,
  image?: ImageInput
): Promise<{ response: IntakeChatResponse; raw: IntakeClaudeResponse }> {
  const client = getAnthropicClient();

  const userContent = buildUserContent(newUserMessage, image);

  const messages: MessageParam[] = [
    ...history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user", content: userContent },
  ];

  const result = await client.messages.parse({
    model: getClaudeModelId(),
    max_tokens: 1024,
    system: INTAKE_SYSTEM_PROMPT,
    messages,
    output_config: {
      format: zodOutputFormat(IntakeClaudeResponseSchema),
    },
  });

  const parsed = result.parsed_output;
  if (!parsed) {
    throw new Error("Claude returned no structured output");
  }

  return {
    response: mapClaudeResponse(parsed),
    raw: parsed,
  };
}

function buildUserContent(
  newUserMessage: string,
  image?: ImageInput
): MessageParam["content"] {
  if (!image) {
    return newUserMessage;
  }

  if (!SUPPORTED_IMAGE_TYPES.has(image.mediaType)) {
    throw new Error("Unsupported image type for vision");
  }

  return [
    {
      type: "image",
      source: {
        type: "base64",
        media_type: image.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: image.base64,
      },
    },
    {
      type: "text",
      text: newUserMessage || "Please estimate the calories for this meal or label.",
    },
  ];
}

function mapClaudeResponse(parsed: IntakeClaudeResponse): IntakeChatResponse {
  return {
    reply: parsed.reply,
    needsClarification: parsed.needs_clarification,
    clarifyingQuestion: parsed.clarifying_question ?? undefined,
    result:
      parsed.needs_clarification || !parsed.result
        ? undefined
        : {
            description: parsed.result.description,
            calories: parsed.result.calories,
            confidence: parsed.result.confidence,
            assumptions: parsed.result.assumptions,
          },
  };
}
