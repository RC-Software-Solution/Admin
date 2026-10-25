import { useRef, useState } from "react";
import "./settings.css";
import { useSettings } from "../../hooks/useSettings";
import { Alert, Button, Card, Field, PageHeader, Spinner } from "../../components/ui";

export default function Settings() {
  const { settings, error, notice, saving, save } = useSettings();
  // Text the admin is typing; null until they touch the field, so it shows the saved value without an effect
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!settings) {
    return (
      <div>
        <PageHeader title="Settings" subtitle="Rules that apply to every customer" />
        {error ? <Alert>Couldn&apos;t load settings: {error}</Alert> : <Spinner label="Loading" />}
      </div>
    );
  }

  const value = draft ?? String(settings.auto_block_unpaid_threshold);
  const n = Number(value);
  const valid = value.trim() !== "" && Number.isInteger(n) && n >= 0 && n <= settings.max_threshold;
  const dirty = valid && n !== settings.auto_block_unpaid_threshold;
  const rule = `Whole number from 0 to ${settings.max_threshold}. Use 0 to turn blocking off.`;

  return (
    <div className="set-page">
      <PageHeader title="Settings" subtitle="Rules that apply to every customer" />

      <Card>
        <form
          className="set-card"
          onSubmit={async (e) => {
            e.preventDefault();
            if (dirty && (await save(n))) {
              setDraft(null);
              inputRef.current?.focus(); // Save is disabled again once clean; keep focus in the form
            }
          }}
        >
          <div>
            <h2 className="set-card__title">Block customers who don&apos;t pay</h2>
            <p className="set-card__text">
              When an order is marked unpaid and the customer has this many unpaid orders, their account is blocked. You can unlock them from Users.
            </p>
          </div>
          <div className="set-card__form">
            <Field label="Block at this many unpaid orders" hint={rule} error={valid ? undefined : rule}>
              <input ref={inputRef} type="number" min={0} max={settings.max_threshold} step={1} value={value} onChange={(e) => setDraft(e.target.value)} />
            </Field>
            <Alert tone="warning">Saving a stricter limit also blocks customers who are already over it.</Alert>
            {error && <Alert>{error}</Alert>}
            {notice && <Alert tone="success">{notice}</Alert>}
            <div className="set-card__save">
              <Button type="submit" variant="primary" loading={saving} disabled={!dirty}>
                Save changes
              </Button>
              <span className="set-card__current">{settings.auto_block_unpaid_threshold === 0 ? "Auto-blocking is off" : `Currently ${settings.auto_block_unpaid_threshold}`}</span>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
