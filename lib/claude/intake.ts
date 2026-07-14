import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages";
import { getAnthropicClient, getClaudeModelId } from "@/lib/claude/client";
import { INTAKE_SYSTEM_PROMPT } from "@/lib/claude/prompts";
import {
  IntakeClaudeResponseSchema,
  type IntakeClaudeResponse,
} from "@/lib/claude/schemas";
import type { ChatMessage, IntakeChatResponse } from "@/lib/types/chat";

export async function estimateIntake(
  history: ChatMessage[],
  newUserMessage: string
): Promise<{ response: IntakeChatResponse; raw: IntakeClaudeResponse }> {
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
