/** GET /users/settings */
export interface Settings {
    auto_block_unpaid_threshold: number; // 0 = auto-blocking off
    max_threshold: number;
}

/** PUT /users/settings */
export interface SettingsSaved {
    auto_block_unpaid_threshold: number;
    blocked_now: number; // customers the follow-up sweep blocked straight away
}
