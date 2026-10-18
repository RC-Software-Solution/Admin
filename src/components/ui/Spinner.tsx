interface SpinnerProps {
  size?: "sm" | "md";
  label?: string; // omit when the spinner sits inside a control that already says what is loading
}

export function Spinner({ size = "md", label }: SpinnerProps) {
  return (
    <span
      className={`ui-spinner ui-spinner--${size}`}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
