import { api, clearSession, setToken, USER_API } from "./apiClient";

const ADMIN_ROLES = ["admin", "super_admin"];

export async function login(email: string, password: string) {
  const res = await api<{ access_token: string; user: { role: string; full_name: string } }>(USER_API, "/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  // The login endpoint serves customers too; this console is staff-only
  if (!ADMIN_ROLES.includes(res.user.role)) throw new Error("This account is not an admin");
  setToken(res.access_token);
  localStorage.setItem("user", JSON.stringify({ name: res.user.full_name, role: res.user.role }));
}

/** Revokes the refresh token server-side (best effort), then drops the local session. */
export async function logout() {
  await api(USER_API, "/users/logout", { method: "POST" }).catch(() => {});
  clearSession();
}

export const forgotPassword = (email: string) =>
  api<{ message: string }>(USER_API, "/users/forgot-password", { method: "POST", body: JSON.stringify({ email }) });

export const resetPassword = (token: string, newPassword: string) =>
  api<{ message: string }>(USER_API, "/users/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
