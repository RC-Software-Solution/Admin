interface SegmentedProps<T extends string> {
  label: string; // names the group for screen readers
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

/** Picks one of a few views of the same data (a date range). Chips filter a list; this switches a range. */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="ui-segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className="ui-segmented__btn" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
