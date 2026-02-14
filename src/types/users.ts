export type UserStatus = "pending" | "accepted" | "rejected" | "suspended" | "blocked";

export interface UserRow {
    id: string;
    name: string;
    email: string;
    area: string;
    status: UserStatus;
    registered: string; // display text like "Dec 5, 2025"
}

export type UserTab = {
    key: UserStatus;
    label: string;
};
