import { api, MENU_API, ORDER_API } from "../../services/apiClient";
import type { Order } from "../../types/orders";
import type { MealSession, SessionForm } from "../../types/menu";

// A day has at most three sessions (unique date + meal time), so one page of 10 is the whole day.
export const listSessions = (date: string) =>
  api<{ data: { mealSessions: MealSession[] } }>(MENU_API, `/meal-sessions?date=${date}&limit=10`).then((r) => r.data.mealSessions);

export const createSession = (s: SessionForm) => api<unknown>(MENU_API, "/meal-sessions", { method: "POST", body: JSON.stringify(s) });

export const updateSession = (id: number, s: SessionForm) =>
  api<unknown>(MENU_API, `/meal-sessions/${id}`, { method: "PUT", body: JSON.stringify(s) });

export const deleteSession = (id: number) => api<unknown>(MENU_API, `/meal-sessions/${id}`, { method: "DELETE" });

/** quantity null = unlimited */
export const addItems = (id: number, items: { food_item_id: number; available_quantity: number | null }[]) =>
  api<unknown>(MENU_API, `/meal-sessions/${id}/items`, { method: "POST", body: JSON.stringify({ food_items: items }) });

export const setItemQuantity = (itemId: number, available_quantity: number | null) =>
  api<unknown>(MENU_API, `/meal-session-items/${itemId}`, { method: "PUT", body: JSON.stringify({ available_quantity }) });

export const removeItem = (itemId: number) => api<unknown>(MENU_API, `/meal-session-items/${itemId}`, { method: "DELETE" });

/** Orders placed for one session: orders carry the session's date and meal time rather than its id. */
export const listSessionOrders = (s: Pick<MealSession, "date" | "meal_time">) =>
  api<{ orders: Order[] }>(ORDER_API, `/orders?type=all&target_date=${s.date}&meal_time=${s.meal_time}&limit=200`).then((r) => r.orders);

/** Who covers which area in a session (one driver per area). */
export interface DeliveryAssignment { area_id: number; user_id: string }

export const getSessionDelivery = (id: number) =>
  api<{ data: { assignments: DeliveryAssignment[] } }>(MENU_API, `/meal-sessions/${id}/delivery`).then((r) => r.data.assignments);

/** Replaces the session's whole set; an empty list clears it. */
export const setSessionDelivery = (id: number, assignments: DeliveryAssignment[]) =>
  api<unknown>(MENU_API, `/meal-sessions/${id}/delivery`, { method: "PUT", body: JSON.stringify({ assignments }) });
