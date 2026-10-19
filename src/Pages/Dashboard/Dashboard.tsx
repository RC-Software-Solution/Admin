import "./overview.css";
import { useDashboard } from "../../hooks/useDashboard";
import { Alert, Button, PageHeader, Spinner } from "../../components/ui";
import RangeFilters from "../../components/common/RangeFilters";
import AttentionStrip from "./AttentionStrip";
import KpiPanel from "./KpiPanel";
import SessionChart from "./SessionChart";
import TopItemsList from "./TopItemsList";
import AreaList from "./AreaList";
import { MAX_DAYS, bucketDays, listDays, rangeDays, unitOf } from "./dashboard.logic";

const dayLabel = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-LK", { day: "numeric", month: "short", timeZone: "UTC" });

export default function Dashboard() {
  const d = useDashboard();
  const { data, error, updatedAt, refresh } = d;

  if (!data) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Sales and orders at a glance" />
        {error ? (
          <>
            <Alert>Couldn&apos;t load the dashboard: {error}</Alert>
            <Button onClick={refresh}>Retry</Button>
          </>
        ) : (
          <Spinner label="Loading" />
        )}
      </div>
    );
  }

  const { stats, sessions, topItems, areas, errors, range } = data;
  // Everything below describes the range the data was loaded for, which lags the picker while a new range loads
  const dayCount = rangeDays(range.from, range.to);
  const unit = unitOf(dayCount);
  const allDays = listDays(range.from, range.to);
  const days = bucketDays(allDays.slice(-MAX_DAYS), sessions);
  const subtitle = `Sales and orders for ${range.from === range.to ? dayLabel(range.from) : `${dayLabel(range.from)} to ${dayLabel(range.to)}`}, compared with the ${unit} before`;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={subtitle} actions={<RangeFilters f={d} showRange={false} />} />

      <AttentionStrip />

      {error && <Alert tone="warning">Showing stale data, the last refresh failed: {error}</Alert>}
      {errors.length > 0 && <Alert tone="warning">Some sections are unavailable: {errors.join(", ")}</Alert>}

      <div className={d.loading ? "dash-dim" : undefined}>
        <div className="dash-row">
          <KpiPanel stats={stats} unit={unit} days={days} />
          <SessionChart days={days} />
        </div>
        {allDays.length > MAX_DAYS && <p className="ui-hint">The charts show the last {MAX_DAYS} days of the range; the totals cover all of it.</p>}

        <h2 className="ui-section">Top items</h2>
        <TopItemsList items={topItems ?? []} />

        <h2 className="ui-section">Areas</h2>
        <AreaList rows={areas ?? []} />
      </div>

      <p className="ui-hint">
        Updated {updatedAt?.toLocaleTimeString()}.{" "}
        <Button variant="ghost" size="sm" onClick={refresh}>
          Refresh
        </Button>
      </p>
    </div>
  );
}
