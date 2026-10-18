import { cloneElement, useId } from "react";
import type { ReactElement } from "react";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: ReactElement; // one input, select or textarea
}

export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;
  return (
    <div className="ui-field">
      <label htmlFor={id} className="ui-field__label">{label}</label>
      {cloneElement(children, {
        id,
        "aria-describedby": note ? noteId : undefined,
        "aria-invalid": error ? true : undefined,
      } as Record<string, unknown>)}
      {note && <p id={noteId} className={error ? "ui-field__error" : "ui-field__hint"}>{note}</p>}
    </div>
  );
}
