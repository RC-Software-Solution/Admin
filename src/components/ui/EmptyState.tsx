import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, hint, action }: EmptyStateProps) {
  return (
    <div className="ui-empty">
      <p className="ui-empty__title">{title}</p>
      {hint && <p className="ui-empty__hint">{hint}</p>}
      {action}
    </div>
  );
}
