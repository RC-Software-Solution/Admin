export const USER_API = import.meta.env.VITE_USER_API ?? "http://localhost:4001/api";
export const ANALYTICS_API = import.meta.env.VITE_ANALYTICS_API ?? "http://localhost:4006/api";
export const LOCATIONS_API = import.meta.env.VITE_LOCATIONS_API ?? "http://localhost:4004/api";
export const ORDER_API = import.meta.env.VITE_ORDER_API ?? "http://localhost:4002/api";

const TOKEN_KEY = "access_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);

/** Signed-in admin from the token itself (a hand-set localStorage flag can't fake this); null if missing or expired. UI gating only, the backend enforces roles. */
export function getSession(): { name: string; role: string } | null {
  try {
    const payload = JSON.parse(atob(getToken()!.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp * 1000 < Date.now()) return null;
    return { role: payload.role, name: JSON.parse(localStorage.getItem("user") ?? "{}").name ?? "Admin" };
  } catch {
    return null;
  }
}

/** Everything the app stores about the session; the Topbar logout and a 401 both use this. */
export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("user");
};

// ponytail: no refresh-token handling; when the access token expires the admin logs in again.
export async function api<T>(base: string, path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(base + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    // A wrong password on /login is also a 401, which isn't an expired session
    if (res.status === 401 && !path.endsWith("/login")) {
      clearSession();
      window.location.assign("/login");
    }
    throw new Error(body.message ?? body.error ?? `Request failed (${res.status})`);
  }
  return body as T;
}
