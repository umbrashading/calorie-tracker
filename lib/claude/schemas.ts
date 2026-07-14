import { z } from "zod";

export const IntakeClaudeResponseSchema = z.object({
  reply: z.string().describe("Friendly message shown to the user in the chat"),
  needs_clarification: z
    .boolean()
    .describe("True if portion size or details are too vague to estimate"),
  clarifying_question: z
    .string()
    .nullable()
    .optional()
    .describe("Follow-up question when needs_clarification is true"),
  result: z
    .object({
      description: z.string().describe("Concise summary of what was eaten"),
      calories: z.number().int().min(0).describe("Estimated calorie count"),
      confidence: z.enum(["high", "medium", "low"]),
      assumptions: z
        .string()
        .describe("Brief note on assumptions made for the estimate"),
    })
    .nullable()
    .optional()
    .describe("Populated when needs_clarification is false"),
});

export type IntakeClaudeResponse = z.infer<typeof IntakeClaudeResponseSchema>;
