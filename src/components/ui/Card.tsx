import type { ReactNode } from "react";

interface CardProps {
  title?: ReactNode;
  actions?: ReactNode;
  flush?: boolean; // no body padding, for tables that run edge to edge
  children: ReactNode;
}

export function Card({ title, actions, flush = false, children }: CardProps) {
  return (
    <section className="ui-card">
      {(title || actions) && (
        <div className="ui-card__header">
          <h2 className="ui-card__title">{title}</h2>
          {actions}
        </div>
      )}
      <div className={flush ? undefined : "ui-card__body"}>{children}</div>
    </section>
  );
}
