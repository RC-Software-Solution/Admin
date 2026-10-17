import { USER_API, api } from "../../services/apiClient";
import type { Settings, SettingsSaved } from "../../types/settings";

export const getSettings = () => api<Settings>(USER_API, "/users/settings");

export const saveSettings = (autoBlockUnpaidThreshold: number) =>
  api<SettingsSaved>(USER_API, "/users/settings", {
    method: "PUT",
    body: JSON.stringify({ auto_block_unpaid_threshold: autoBlockUnpaidThreshold }),
  });
