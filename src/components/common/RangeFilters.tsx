import type { useRangeFilters, Preset } from "../../hooks/useRangeFilters";

const PRESETS: { id: Preset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "custom", label: "Custom" },
];

const day = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

/** Preset / custom range, area and session pickers; styled by the `.filters` rules in dashboard.css. */
export default function RangeFilters({ f }: { f: ReturnType<typeof useRangeFilters> }) {
  const rangeLabel = f.range.from === f.range.to ? day(f.range.from) : `${day(f.range.from)} – ${day(f.range.to)}`;
  return (
    <div className="filters">
      <div className="tabs">
        {PRESETS.map((p) => (
          <button key={p.id} className={`tab ${f.preset === p.id ? "tab--active" : ""}`} onClick={() => f.setPreset(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      {f.preset === "custom" && (
        <>
          <input type="date" aria-label="From" value={f.custom.from} max={f.custom.to} onChange={(e) => e.target.value && f.setCustom({ ...f.custom, from: e.target.value })} />
          <input type="date" aria-label="To" value={f.custom.to} min={f.custom.from} onChange={(e) => e.target.value && f.setCustom({ ...f.custom, to: e.target.value })} />
        </>
      )}
      <select aria-label="Area" value={f.areaId} onChange={(e) => f.setAreaId(e.target.value)}>
        <option value="">All areas</option>
        {f.areas.map((a) => <option key={a.area_id} value={a.area_id}>{a.area_name}</option>)}
      </select>
      <select aria-label="Session" value={f.session} onChange={(e) => f.setSession(e.target.value as typeof f.session)}>
        <option value="">All sessions</option>
        <option value="breakfast">Breakfast</option>
        <option value="lunch">Lunch</option>
        <option value="dinner">Dinner</option>
      </select>
      <span className="filters__range">{rangeLabel}</span>
    </div>
  );
}
