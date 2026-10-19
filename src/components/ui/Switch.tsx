interface SwitchProps {
  label: string; // names the switch for screen readers; make it unique per row
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  showState?: boolean; // a visible "On" / "Off" beside it
}

/** An on/off setting that takes effect at once (a food item's availability). Use a checkbox when the choice waits for a Save button. */
export function Switch({ label, checked, onChange, disabled, showState = false }: SwitchProps) {
  return (
    <span className="ui-switchwrap">
      <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className="ui-switch" onClick={() => onChange(!checked)} />
      {showState && (
        <span className="ui-switchwrap__state" aria-hidden="true">
          {checked ? "On" : "Off"}
        </span>
      )}
    </span>
  );
}
