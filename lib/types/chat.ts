import type { Confidence } from "@/lib/types/database";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface IntakeChatRequest {
  messages: ChatMessage[];
  newUserMessage: string;
}

export interface IntakeEstimateResult {
  description: string;
  calories: number;
  confidence: Confidence;
  assumptions: string;
}

export interface IntakeChatResponse {
  reply: string;
  needsClarification: boolean;
  clarifyingQuestion?: string;
  result?: IntakeEstimateResult;
}

export interface SaveIntakeEntryRequest {
  description: string;
  calories: number;
  confidence: Confidence;
  assumptions?: string;
  logged_at?: string;
  raw_model_response?: Record<string, unknown>;
}
