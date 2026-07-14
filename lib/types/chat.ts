import type { Confidence } from "@/lib/types/database";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface EstimateResult {
  description: string;
  calories: number;
  confidence: Confidence;
  assumptions: string;
}

export type IntakeEstimateResult = EstimateResult;

export interface IntakeChatRequest {
  messages: ChatMessage[];
  newUserMessage: string;
  imageBase64?: string;
  imageMediaType?: string;
}

export interface IntakeChatResponse {
  reply: string;
  needsClarification: boolean;
  clarifyingQuestion?: string;
  result?: IntakeEstimateResult;
  imagePath?: string;
}

export interface SaveIntakeEntryRequest {
  description: string;
  calories: number;
  confidence: Confidence;
  assumptions?: string;
  image_path?: string;
  logged_at?: string;
  raw_model_response?: Record<string, unknown>;
}

export interface BurnEstimateResult extends EstimateResult {
  exercise_type?: string;
  duration_minutes?: number | null;
  intensity?: string | null;
}

export interface BurnChatRequest {
  messages: ChatMessage[];
  newUserMessage: string;
}

export interface BurnChatResponse {
  reply: string;
  needsClarification: boolean;
  clarifyingQuestion?: string;
  result?: BurnEstimateResult;
}

export interface SaveBurnEntryRequest {
  description: string;
  calories: number;
  confidence: Confidence;
  assumptions?: string;
  exercise_type?: string;
  duration_minutes?: number | null;
  intensity?: string | null;
  logged_at?: string;
  raw_model_response?: Record<string, unknown>;
}
