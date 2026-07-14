import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages";
import { getAnthropicClient, getClaudeModelId } from "@/lib/claude/client";
import { buildBurnSystemPrompt } from "@/lib/claude/prompts";
import { BurnClaudeResponseSchema, type BurnClaudeResponse } from "@/lib/claude/schemas";
import type { Profile } from "@/lib/types/database";
import type { BurnChatResponse, ChatMessage } from "@/lib/types/chat";

export async function estimateBurn(
  profile: Pick<
    Profile,
    "display_name" | "age" | "sex" | "height_cm" | "weight_kg" | "average_daily_steps"
  >,
  history: ChatMessage[],
  newUserMessage: string
): Promise<{ response: BurnChatResponse; raw: BurnClaudeResponse }> {
  const client = getAnthropicClient();

  const messages: MessageParam[] = [
    ...history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user", content: newUserMessage },
  ];

  const result = await client.messages.parse({
    model: getClaudeModelId(),
    max_tokens: 1024,
    system: buildBurnSystemPrompt(profile),
    messages,
    output_config: {
      format: zodOutputFormat(BurnClaudeResponseSchema),
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

function mapClaudeResponse(parsed: BurnClaudeResponse): BurnChatResponse {
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
            exercise_type: parsed.result.exercise_type ?? undefined,
            duration_minutes: parsed.result.duration_minutes ?? undefined,
            intensity: parsed.result.intensity ?? undefined,
          },
  };
}
