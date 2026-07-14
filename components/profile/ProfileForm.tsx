"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile, Sex } from "@/lib/types/database";

interface ProfileFormProps {
  initialProfile: Profile;
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    display_name: initialProfile.display_name ?? "",
    avatar_emoji: initialProfile.avatar_emoji,
    age: initialProfile.age != null ? String(initialProfile.age) : "",
    sex: initialProfile.sex ?? "",
    height_cm: initialProfile.height_cm != null ? String(initialProfile.height_cm) : "",
    weight_kg: initialProfile.weight_kg != null ? String(initialProfile.weight_kg) : "",
    daily_calorie_target:
      initialProfile.daily_calorie_target != null
        ? String(initialProfile.daily_calorie_target)
        : "",
    average_daily_steps:
      initialProfile.average_daily_steps != null
        ? String(initialProfile.average_daily_steps)
        : "8000",
    timezone: initialProfile.timezone,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!form.timezone) {
      setForm((current) => ({
        ...current,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }));
    }
  }, [form.timezone]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const payload = {
      display_name: form.display_name.trim() || null,
      avatar_emoji: form.avatar_emoji.trim() || "🙂",
      age: form.age ? Number(form.age) : null,
      sex: form.sex ? (form.sex as Sex) : null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      daily_calorie_target: form.daily_calorie_target
        ? Number(form.daily_calorie_target)
        : null,
      average_daily_steps: form.average_daily_steps
        ? Number(form.average_daily_steps)
        : null,
      timezone: form.timezone.trim(),
    };

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save profile");
      }

      setSaved(true);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-neutral-700">Display name</span>
          <input
            value={form.display_name}
            onChange={(event) => setForm({ ...form, display_name: event.target.value })}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-neutral-300 px-4 text-base"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-neutral-700">Avatar emoji</span>
          <input
            value={form.avatar_emoji}
            onChange={(event) => setForm({ ...form, avatar_emoji: event.target.value })}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-neutral-300 px-4 text-base"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-neutral-700">Age</span>
          <input
            type="number"
            min={10}
            max={120}
            value={form.age}
            onChange={(event) => setForm({ ...form, age: event.target.value })}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-neutral-300 px-4 text-base"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-neutral-700">Sex</span>
          <select
            value={form.sex}
            onChange={(event) => setForm({ ...form, sex: event.target.value })}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-neutral-300 px-4 text-base"
          >
            <option value="">Not set</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-neutral-700">Height (cm)</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={form.height_cm}
            onChange={(event) => setForm({ ...form, height_cm: event.target.value })}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-neutral-300 px-4 text-base"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-neutral-700">Weight (kg)</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={form.weight_kg}
            onChange={(event) => setForm({ ...form, weight_kg: event.target.value })}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-neutral-300 px-4 text-base"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-neutral-700">Average daily steps</span>
          <input
            type="number"
            min={0}
            step={100}
            value={form.average_daily_steps}
            onChange={(event) =>
              setForm({ ...form, average_daily_steps: event.target.value })
            }
            className="mt-1 min-h-[44px] w-full rounded-xl border border-neutral-300 px-4 text-base"
          />
          <span className="mt-1 block text-xs text-neutral-500">
            Estimates your typical daily walking calories before you log today&apos;s step
            count. Once steps are entered, actual steps are used instead.
          </span>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-neutral-700">Daily calorie target</span>
          <input
            type="number"
            min={500}
            max={10000}
            value={form.daily_calorie_target}
            onChange={(event) =>
              setForm({ ...form, daily_calorie_target: event.target.value })
            }
            className="mt-1 min-h-[44px] w-full rounded-xl border border-neutral-300 px-4 text-base"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-neutral-700">Timezone</span>
          <input
            value={form.timezone}
            onChange={(event) => setForm({ ...form, timezone: event.target.value })}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-neutral-300 px-4 text-base"
          />
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {saved ? <p className="text-sm text-emerald-600">Profile saved.</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="min-h-[44px] rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
