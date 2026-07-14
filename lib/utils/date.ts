export function todayInTimezone(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(now);
}

export function getDayFraction(timezone: string, now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const second = Number(parts.find((part) => part.type === "second")?.value ?? 0);
  const minutesElapsed = hour * 60 + minute + second / 60;

  return Math.min(1, Math.max(0, minutesElapsed / 1440));
}

export function formatDisplayDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function startOfWeek(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

export function endOfWeek(dateStr: string): string {
  return addDays(startOfWeek(dateStr), 6);
}

function findLocalMidnightUtcMs(year: number, month: number, day: number, timezone: string): number {
  const target = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  for (let utcHour = -14; utcHour < 38; utcHour++) {
    const candidate = new Date(Date.UTC(year, month - 1, day, utcHour, 0, 0));
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(candidate);

    const y = parts.find((part) => part.type === "year")?.value;
    const m = parts.find((part) => part.type === "month")?.value;
    const d = parts.find((part) => part.type === "day")?.value;
    const h = parts.find((part) => part.type === "hour")?.value;
    const localDate = `${y}-${m}-${d}`;

    if (localDate === target && h === "00") {
      return candidate.getTime();
    }
  }

  return Date.UTC(year, month - 1, day);
}

export function utcRangeForLocalDate(
  dateStr: string,
  timezone: string
): { startIso: string; endIso: string } {
  const [year, month, day] = dateStr.split("-").map(Number);
  const nextDate = addDays(dateStr, 1);
  const [nextYear, nextMonth, nextDay] = nextDate.split("-").map(Number);

  const startMs = findLocalMidnightUtcMs(year, month, day, timezone);
  const endMs = findLocalMidnightUtcMs(nextYear, nextMonth, nextDay, timezone);

  return {
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(endMs).toISOString(),
  };
}
