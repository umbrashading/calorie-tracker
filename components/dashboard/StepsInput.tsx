"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StepsInputProps {
  initialSteps: number;
  entryDate: string;
}

export function StepsInput({ initialSteps, entryDate }: StepsInputProps) {
  const router = useRouter();
  const [steps, setSteps] = useState(String(initialSteps));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number(steps);

    if (!Number.isInteger(parsed) || parsed < 0) {
      setError("Enter a non-negative whole number of steps.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: parsed, entry_date: entryDate }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save steps");
      }

      setSaved(true);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save steps");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSave(event)} className="rounded-xl border border-neutral-200 bg-white p-4">
      <label htmlFor="steps" className="text-sm font-medium text-neutral-700">
        Today&apos;s steps
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="steps"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={steps}
          onChange={(event) => {
            setSteps(event.target.value);
            setSaved(false);
          }}
          className="min-h-[44px] flex-1 rounded-xl border border-neutral-300 bg-white px-4 text-base"
        />
        <button
          type="submit"
          disabled={saving}
          className="min-h-[44px] rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {saved ? <p className="mt-2 text-sm text-emerald-600">Steps saved.</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
