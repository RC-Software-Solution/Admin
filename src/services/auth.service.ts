import { api, setToken, USER_API } from "./apiClient";

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
