import React, { useState } from "react";
import "../Dashboard/dashboard.css";
import { useSettings } from "../../hooks/useSettings";

const Settings: React.FC = () => {
  const { settings, error, notice, saving, save } = useSettings();
  // Text the admin is typing; null until they touch the field, so it shows the saved value without an effect
  const [draft, setDraft] = useState<string | null>(null);

  if (!settings) {
    return (
      <div className="content">
        <h1 className="pageTitle">Settings</h1>
        <div className="pageSub">{error ? `Couldn't load settings: ${error}` : "Loading…"}</div>
      </div>
    );
  }

  const value = draft ?? String(settings.auto_block_unpaid_threshold);
  const n = Number(value);
  const valid = value.trim() !== "" && Number.isInteger(n) && n >= 0 && n <= settings.max_threshold;
  const dirty = valid && n !== settings.auto_block_unpaid_threshold;

  return (
    <div className="content">
      <h1 className="pageTitle">Settings</h1>
      <div className="pageSub">Rules that apply to every customer</div>

      <section className="card">
        <div className="card__header"><div className="card__title">Auto-block unpaid customers</div></div>
        <form
          className="filters"
          onSubmit={async (e) => {
            e.preventDefault();
            if (dirty && (await save(n))) setDraft(null);
          }}
        >
          <label>
            Block a customer at{" "}
            <input type="number" min={0} max={settings.max_threshold} step={1} value={value} onChange={(e) => setDraft(e.target.value)} aria-label="Unpaid orders before blocking" />{" "}
            unpaid orders
          </label>
          <button type="submit" disabled={!dirty || saving}>{saving ? "Saving…" : "Save"}</button>
        </form>
        <div className="pageSub">
          {settings.auto_block_unpaid_threshold === 0 ? "Auto-blocking is off." : `Customers are blocked when an order is marked unpaid and they have ${settings.auto_block_unpaid_threshold} or more.`}{" "}
          Set 0 to turn it off. Saving a stricter limit also blocks customers who are already over it. Blocked customers can be unlocked from Users.
        </div>
        {!valid && <div className="sectionNote">Enter a whole number from 0 to {settings.max_threshold}.</div>}
        {error && <div className="sectionNote">{error}</div>}
        {notice && <div className="pageSub">{notice}</div>}
      </section>
    </div>
  );
};

export default Settings;
