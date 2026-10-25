export const API_VARS = [
  "VITE_USER_API",
  "VITE_ANALYTICS_API",
  "VITE_LOCATIONS_API",
  "VITE_MENU_API",
  "VITE_ORDER_API",
] as const;

/** The distinct origins the console calls; throws naming every variable that is missing or not a URL. */
export function apiOrigins(env: Record<string, string | undefined>): string[] {
  const bad = API_VARS.filter((k) => !URL.canParse(env[k] ?? ""));
  if (bad.length) throw new Error(`Missing or invalid URL: ${bad.join(", ")}`);
  return [...new Set(API_VARS.map((k) => new URL(env[k]!).origin))];
}
