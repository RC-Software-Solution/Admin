import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  loading?: boolean;
}

export function Button({ variant = "secondary", size = "md", loading = false, disabled, className, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={["ui-btn", `ui-btn--${variant}`, `ui-btn--${size}`, className].filter(Boolean).join(" ")}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
