import type { DailySummary } from "@/lib/types/database";

export function formatNetCalories(net: number | null): string {
  if (net == null) return "—";
  if (net > 0) return `+${net}`;
  return String(net);
}

export function netCalorieTone(net: number | null): "neutral" | "surplus" | "deficit" {
  if (net == null || net === 0) return "neutral";
  return net > 0 ? "surplus" : "deficit";
}

export function sortSummariesByDisplayName(summaries: DailySummary[]): DailySummary[] {
  return [...summaries].sort((left, right) => {
    const leftName = left.display_name ?? "";
    const rightName = right.display_name ?? "";
    return leftName.localeCompare(rightName);
  });
}
