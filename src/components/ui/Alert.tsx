import type { ReactNode } from "react";

interface AlertProps {
  tone?: "danger" | "warning" | "success" | "info";
  children: ReactNode;
}

export function Alert({ tone = "danger", children }: AlertProps) {
  return (
    <div className={`ui-alert ui-alert--${tone}`} role={tone === "danger" ? "alert" : "status"}>
      {children}
    </div>
  );
}
