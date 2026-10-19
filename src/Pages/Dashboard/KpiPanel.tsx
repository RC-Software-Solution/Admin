import { formatMoney } from "../../utils/formatMoney";
import type { DashboardData } from "../../types/dashboard";
import { barLabel, heightPct, trendOf } from "./dashboard.logic";
import type { DayBucket } from "./dashboard.logic";

interface KpiPanelProps {
  stats: DashboardData["stats"];
  unit: string; // "7 days", "day": how the previous range is named in the trend text
  days: DayBucket[];
}

const count = (n: number) => n.toLocaleString("en-LK");

/** Sales and order totals with their trend, and a small orders-per-day bar chart. */
export default function KpiPanel({ stats, unit, days }: KpiPanelProps) {
  const { sales, orders } = stats;
  const salesTrend = trendOf(sales?.change, unit);
  const ordersTrend = trendOf(orders?.change, unit);
  const max = Math.max(0, ...days.map((d) => d.total));
  const summary = days.map((d) => `${d.date}: ${d.total}`).join(", ");
  return (
    <section className="dash-panel" aria-label="Sales and orders">
      <div className="dash-kpis">
        <div>
          <div className="dash-kpi__label">Sales (paid)</div>
          {/* keyed on the value so a change remounts it and replays the flash animation */}
          <div className="dash-kpi__value dash-kpi__value--flash" key={sales?.value ?? "none"}>{formatMoney(sales?.value ?? null)}</div>
          <div className={`dash-delta dash-delta--${sales ? salesTrend.tone : "flat"}`}>{sales ? salesTrend.text : "Unavailable"}</div>
        </div>
        <div>
          <div className="dash-kpi__label">Orders</div>
          <div className="dash-kpi__value dash-kpi__value--flash" key={orders?.total ?? "none"}>{orders ? count(orders.total) : "—"}</div>
          <div className={`dash-delta dash-delta--${orders ? ordersTrend.tone : "flat"}`}>
            {orders ? `${ordersTrend.text} · ${count(orders.completed)} completed` : "Unavailable"}
          </div>
        </div>
      </div>
      <p className="dash-caption">Orders per day</p>
      <div className="dash-spark" role="img" aria-label={`Orders per day: ${summary}`}>
        {days.map((d, i) => (
          <div key={d.date} className="dash-col" title={`${d.date}: ${d.total} orders`}>
            <div className="dash-col__plot">
              <i className={`dash-spark__bar${i === days.length - 1 ? " is-last" : ""}`} style={{ height: `${heightPct(d.total, max)}%` }} />
            </div>
            <span className="dash-col__label">{barLabel(d.date, days.length, i)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
