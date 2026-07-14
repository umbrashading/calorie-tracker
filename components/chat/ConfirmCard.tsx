import type { IntakeEstimateResult } from "@/lib/types/chat";

interface ConfirmCardProps {
  result: IntakeEstimateResult;
  saving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmCard({ result, saving, onConfirm, onCancel }: ConfirmCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-medium text-neutral-500">Confirm entry</h3>
      <p className="mt-2 text-lg font-semibold">{result.description}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{result.calories} kcal</p>
      <p className="mt-2 text-sm text-neutral-600">
        Confidence: <span className="capitalize">{result.confidence}</span>
      </p>
      {result.assumptions ? (
        <p className="mt-2 text-sm text-neutral-500">{result.assumptions}</p>
      ) : null}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={saving}
          className="flex-1 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Confirm & save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 disabled:opacity-60"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
