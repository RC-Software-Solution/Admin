import type { UserStatus } from "../../types/users";

export type CustomerAction = "approve" | "reject" | "disable" | "enable" | "unlock";

/** What a super admin can do to a customer in each status. A primary action moves the customer forward. */
export const ACTIONS: Record<UserStatus, { kind: CustomerAction; label: string; primary?: boolean }[]> = {
  pending: [
    { kind: "approve", label: "Approve", primary: true },
    { kind: "reject", label: "Reject" },
  ],
  accepted: [{ kind: "disable", label: "Disable" }],
  rejected: [],
  disabled: [{ kind: "enable", label: "Enable" }],
  blocked: [{ kind: "unlock", label: "Unlock", primary: true }],
};
