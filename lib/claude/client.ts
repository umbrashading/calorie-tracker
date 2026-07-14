import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL_ID } from "@/lib/claude/constants";

let client: Anthropic | null = null;

export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  if (!client) {
    client = new Anthropic({ apiKey });
  }

  return client;
}

export function getClaudeModelId() {
  return CLAUDE_MODEL_ID;
}
