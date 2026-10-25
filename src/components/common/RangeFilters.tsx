import { FilterBar, Segmented } from "../ui";
import type { useRangeFilters, Preset } from "../../hooks/useRangeFilters";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom" },
];

const day = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

/** Preset / custom range, area and session pickers, shared by the Dashboard and Reports. */
export default function RangeFilters({ f, showRange = true }: { f: ReturnType<typeof useRangeFilters>; showRange?: boolean }) {
  const rangeLabel = f.range.from === f.range.to ? day(f.range.from) : `${day(f.range.from)} – ${day(f.range.to)}`;
  return (
    <FilterBar label="Range, area and session">
      <Segmented label="Range" value={f.preset} options={PRESETS} onChange={f.setPreset} />
      {f.preset === "custom" && (
        <>
          <label>
            From <input type="date" value={f.custom.from} max={f.custom.to} onChange={(e) => e.target.value && f.setCustom({ ...f.custom, from: e.target.value })} />
          </label>
          <label>
            To <input type="date" value={f.custom.to} min={f.custom.from} onChange={(e) => e.target.value && f.setCustom({ ...f.custom, to: e.target.value })} />
          </label>
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
      {showRange && <span className="ui-filterbar__note">{rangeLabel}</span>}
    </FilterBar>
  );
}
