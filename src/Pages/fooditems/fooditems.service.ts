import { api, MENU_API } from "../../services/apiClient";
import type { FoodItem, FoodItemForm } from "../../types/menu";

const body = (f: FoodItemForm) => JSON.stringify({ ...f, description: f.description || null, image_url: f.image_url || null });

// The list is paginated server-side (default 10); a canteen menu is small, so take it all at once.
export const listFoodItems = () =>
  api<{ data: { foodItems: FoodItem[] } }>(MENU_API, "/food-items?limit=1000").then((r) => r.data.foodItems);

export const createFoodItem = (f: FoodItemForm) => api<unknown>(MENU_API, "/food-items", { method: "POST", body: body(f) });

export const updateFoodItem = (id: number, f: FoodItemForm) =>
  api<unknown>(MENU_API, `/food-items/${id}`, { method: "PUT", body: body(f) });

export const deleteFoodItem = (id: number) => api<unknown>(MENU_API, `/food-items/${id}`, { method: "DELETE" });
