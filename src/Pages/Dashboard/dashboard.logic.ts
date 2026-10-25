import type { MealType, SessionDay } from "../../types/dashboard";

export const MEALS: MealType[] = ["breakfast", "lunch", "dinner"];

// ponytail: a custom range longer than this charts only its last MAX_DAYS days (the bars would be sub-pixel); the KPI numbers still cover the whole range. Raise it or aggregate by week if long ranges matter.
export const MAX_DAYS = 62;

export interface DayBucket {
  date: string; // YYYY-MM-DD, Sri Lanka calendar day
  orders: Record<MealType, number>;
  total: number;
}

/** Every calendar day from `from` to `to`, inclusive (empty when `from` is after `to`). Pure date arithmetic, no timezone involved. */
export function listDays(from: string, to: string): string[] {
  const out: string[] = [];
  for (let t = Date.parse(`${from}T00:00:00Z`), end = Date.parse(`${to}T00:00:00Z`); t <= end; t += 86400000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/** One bucket per day with that day's orders for each meal. Days and meals the API sent nothing for count as 0. */
export function bucketDays(days: string[], sessions: Record<MealType, SessionDay[] | null>): DayBucket[] {
  return days.map((date) => {
    const orders: Record<MealType, number> = { breakfast: 0, lunch: 0, dinner: 0 };
    for (const m of MEALS) orders[m] = sessions[m]?.find((s) => s.date === date)?.orderCount ?? 0;
    return { date, orders, total: orders.breakfast + orders.lunch + orders.dinner };
  });
}

/** Bar height as a percentage of the tallest bar; a non-zero value never rounds away to nothing. */
export const heightPct = (value: number, max: number) => (value <= 0 || max <= 0 ? 0 : Math.max(2, (value / max) * 100));

/** Axis label under a bar: weekday for up to 14 bars, otherwise the day of the month on every 5th bar only. */
export function barLabel(date: string, count: number, index: number): string {
  if (count <= 14) return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  return index % 5 === 0 ? String(Number(date.slice(8))) : "";
}

export interface Trend {
  text: string;
  tone: "up" | "down" | "flat";
}

/** "Up 12.4% on the previous 7 days". `change` is null when the previous range had nothing to compare. */
export const trendOf = (change: number | null | undefined, unit: string): Trend =>
  change === null || change === undefined ? { text: `No data in the previous ${unit}`, tone: "flat" }
  : change === 0 ? { text: `Same as the previous ${unit}`, tone: "flat" }
  : { text: `${change > 0 ? "Up" : "Down"} ${Math.abs(change)}% on the previous ${unit}`, tone: change > 0 ? "up" : "down" };

export const rangeDays = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000) + 1;

export const unitOf = (days: number) => (days === 1 ? "day" : `${days} days`);
