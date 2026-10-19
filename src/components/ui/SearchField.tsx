import type { InputHTMLAttributes } from "react";
import { LuSearch } from "react-icons/lu";

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string; // accessible name; the placeholder is only a hint
}

/** A search box with the magnifier inside it. */
export function SearchField({ label, className, ...rest }: SearchFieldProps) {
  return (
    <div className={["ui-search", className].filter(Boolean).join(" ")}>
      <LuSearch aria-hidden="true" />
      <input type="search" aria-label={label} {...rest} />
    </div>
  );
}
