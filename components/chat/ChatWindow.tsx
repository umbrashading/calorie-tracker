"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmCard } from "@/components/chat/ConfirmCard";
import type {
  ChatMessage,
  IntakeChatResponse,
  IntakeEstimateResult,
} from "@/lib/types/chat";

export function ChatWindow() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingResult, setPendingResult] = useState<IntakeEstimateResult | null>(null);
  const [rawModelResponse, setRawModelResponse] = useState<Record<string, unknown> | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    setLoading(true);
    setPendingResult(null);
    setRawModelResponse(null);

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");

    try {
      const response = await fetch("/api/chat/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          newUserMessage: trimmed,
        }),
      });

      const data = (await response.json()) as IntakeChatResponse & {
        error?: string;
        rawModelResponse?: Record<string, unknown>;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to get estimate");
      }

      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);

      if (data.needsClarification) {
        return;
      }

      if (data.result) {
        setPendingResult(data.result);
        setRawModelResponse(data.rawModelResponse ?? null);
      }
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Something went wrong. Please try again.";
      setError(message);
      setMessages(messages);
      setInput(trimmed);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!pendingResult) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/intake-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: pendingResult.description,
          calories: pendingResult.calories,
          confidence: pendingResult.confidence,
          assumptions: pendingResult.assumptions,
          raw_model_response: rawModelResponse,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save entry");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Failed to save entry. Please try again.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancelConfirm() {
    setPendingResult(null);
    setRawModelResponse(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Describe what you ate or drank — e.g. &quot;two eggs and toast with butter&quot; or
            &quot;a large flat white&quot;.
          </p>
        ) : null}

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === "user"
                ? "ml-8 rounded-2xl rounded-br-md bg-neutral-900 px-4 py-2.5 text-sm text-white"
                : "mr-8 rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-sm text-neutral-800 shadow-sm ring-1 ring-neutral-200"
            }
          >
            {message.content}
          </div>
        ))}

        {loading ? (
          <p className="mr-8 text-sm text-neutral-500">Estimating calories…</p>
        ) : null}

        {pendingResult ? (
          <ConfirmCard
            result={pendingResult}
            saving={saving}
            onConfirm={() => void handleConfirm()}
            onCancel={handleCancelConfirm}
          />
        ) : null}

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 border-t border-neutral-200 bg-neutral-50 pt-3"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="What did you eat?"
            disabled={loading || saving}
            className="min-h-[44px] flex-1 rounded-xl border border-neutral-300 bg-white px-4 text-base"
          />
          <button
            type="submit"
            disabled={loading || saving || !input.trim()}
            className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
