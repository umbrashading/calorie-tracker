"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmCard } from "@/components/chat/ConfirmCard";
import type {
  BurnChatResponse,
  BurnEstimateResult,
  ChatMessage,
  IntakeChatResponse,
  IntakeEstimateResult,
} from "@/lib/types/chat";

type ChatMode = "intake" | "burn";

interface ChatWindowProps {
  mode: ChatMode;
}

const MODE_CONFIG = {
  intake: {
    chatEndpoint: "/api/chat/intake",
    saveEndpoint: "/api/intake-entries",
    emptyHint:
      'Describe what you ate or drank — e.g. "two eggs and toast with butter" or attach a photo of your meal or a nutrition label.',
    placeholder: "What did you eat?",
    redirectTo: "/dashboard",
  },
  burn: {
    chatEndpoint: "/api/chat/burn",
    saveEndpoint: "/api/burn-entries",
    emptyHint:
      'Describe your exercise — e.g. "30 minute brisk walk" or "45 min weight training, moderate intensity".',
    placeholder: "What did you do?",
    redirectTo: "/dashboard",
  },
} as const;

const BOTTOM_NAV_OFFSET = "calc(3.5rem + env(safe-area-inset-bottom))";
const MAX_TEXTAREA_HEIGHT = 160;

export function ChatWindow({ mode }: ChatWindowProps) {
  const router = useRouter();
  const config = MODE_CONFIG[mode];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLFormElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [composerHeight, setComposerHeight] = useState(88);
  const [pendingResult, setPendingResult] = useState<
    IntakeEstimateResult | BurnEstimateResult | null
  >(null);
  const [rawModelResponse, setRawModelResponse] = useState<Record<string, unknown> | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<{
    previewUrl: string;
    base64: string;
    mediaType: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resizeTextarea() {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
  }

  useEffect(() => {
    resizeTextarea();
  }, [input]);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;

    const observer = new ResizeObserver(() => {
      setComposerHeight(composer.offsetHeight);
    });

    observer.observe(composer);
    setComposerHeight(composer.offsetHeight);

    return () => observer.disconnect();
  }, [attachedImage, input, error]);

  function clearAttachedImage() {
    if (attachedImage?.previewUrl) {
      URL.revokeObjectURL(attachedImage.previewUrl);
    }
    setAttachedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB.");
      return;
    }

    setError(null);
    clearAttachedImage();

    const previewUrl = URL.createObjectURL(file);
    const buffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    setAttachedImage({
      previewUrl,
      base64,
      mediaType: file.type,
    });
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    const hasImage = mode === "intake" && attachedImage != null;
    if ((!trimmed && !hasImage) || loading) return;

    setError(null);
    setLoading(true);
    setPendingResult(null);
    setRawModelResponse(null);

    const displayText = trimmed || "Photo attached";
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: displayText }];
    setMessages(nextMessages);
    setInput("");

    const imageToSend = attachedImage;
    clearAttachedImage();

    try {
      const requestBody: Record<string, unknown> = {
        messages,
        newUserMessage: trimmed,
      };

      if (mode === "intake" && imageToSend) {
        requestBody.imageBase64 = imageToSend.base64;
        requestBody.imageMediaType = imageToSend.mediaType;
      }

      const response = await fetch(config.chatEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = (await response.json()) as (IntakeChatResponse | BurnChatResponse) & {
        error?: string;
        rawModelResponse?: Record<string, unknown>;
        imagePath?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to get estimate");
      }

      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);

      if (data.imagePath) {
        setImagePath(data.imagePath);
      }

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
      if (imageToSend) {
        setAttachedImage(imageToSend);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!pendingResult) return;

    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        description: pendingResult.description,
        calories: pendingResult.calories,
        confidence: pendingResult.confidence,
        assumptions: pendingResult.assumptions,
        raw_model_response: rawModelResponse,
      };

      if (mode === "intake" && imagePath) {
        payload.image_path = imagePath;
      }

      if (mode === "burn") {
        const burnResult = pendingResult as BurnEstimateResult;
        payload.exercise_type = burnResult.exercise_type;
        payload.duration_minutes = burnResult.duration_minutes;
        payload.intensity = burnResult.intensity;
      }

      const response = await fetch(config.saveEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save entry");
      }

      router.push(config.redirectTo);
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
    setImagePath(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleTextareaKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  const burnExtraDetails =
    mode === "burn" && pendingResult
      ? [
          (pendingResult as BurnEstimateResult).exercise_type,
          (pendingResult as BurnEstimateResult).duration_minutes != null
            ? `${(pendingResult as BurnEstimateResult).duration_minutes} min`
            : null,
          (pendingResult as BurnEstimateResult).intensity,
        ]
          .filter(Boolean)
          .join(" · ")
      : undefined;

  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] flex-col">
      <div
        className="flex-1 space-y-4 overflow-y-auto"
        style={{ paddingBottom: composerHeight + 16 }}
      >
        {messages.length === 0 ? (
          <p className="text-sm text-neutral-500">{config.emptyHint}</p>
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
            extraDetails={burnExtraDetails}
            onConfirm={() => void handleConfirm()}
            onCancel={handleCancelConfirm}
          />
        ) : null}

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
      </div>

      <form
        ref={composerRef}
        onSubmit={handleSubmit}
        className="fixed inset-x-0 z-40 border-t border-neutral-200 bg-neutral-50/95 backdrop-blur"
        style={{ bottom: BOTTOM_NAV_OFFSET }}
      >
        <div className="mx-auto max-w-2xl px-4 pb-3 pt-3">
          {attachedImage ? (
            <div className="mb-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachedImage.previewUrl}
                alt="Attached meal"
                className="h-16 w-16 rounded-lg object-cover ring-1 ring-neutral-200"
              />
              <button
                type="button"
                onClick={clearAttachedImage}
                className="text-sm text-neutral-600 underline"
              >
                Remove photo
              </button>
            </div>
          ) : null}

          <div className="flex items-end gap-2">
            {mode === "intake" ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => void handleImageSelect(event)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || saving}
                  className="mb-0.5 flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-white text-lg disabled:opacity-60"
                  aria-label="Attach photo"
                >
                  📷
                </button>
              </>
            ) : null}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder={config.placeholder}
              disabled={loading || saving}
              className="max-h-40 min-h-[44px] flex-1 resize-none overflow-y-auto rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-base leading-5"
            />
            <button
              type="submit"
              disabled={loading || saving || (!input.trim() && !attachedImage)}
              className="mb-0.5 min-h-[44px] shrink-0 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
