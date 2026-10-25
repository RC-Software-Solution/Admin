/** Business time is Sri Lanka, whatever the browser's timezone. */
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-LK", { timeZone: "Asia/Colombo", day: "numeric", month: "short", year: "numeric" });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-LK", { timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short" });

/** Today as YYYY-MM-DD in Sri Lanka, never the browser day. */
export const colomboToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });

/** A YYYY-MM-DD day shifted by `n` days (pure calendar arithmetic, no timezone involved). */
export const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
