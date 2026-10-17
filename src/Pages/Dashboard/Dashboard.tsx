import React from "react";
import { StatCard, SessionRow, TopItem } from "../../components/Cards/Card";
import "./dashboard.css";
import { useDashboard } from "../../hooks/useDashboard";
import RangeFilters from "../../components/common/RangeFilters";
import { formatMoney } from "../../utils/formatMoney";
import { CurrencyIcon, ShoppingCartIcon, BanIcon, AlertIcon } from "../../components/common/Icons";

const day = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

/** "12.5% vs previous period" with the arrow and colour the StatCard derives from subType. */
const trend = (change: number | null | undefined, unit: string): { sub?: string; subType: "pos" | "neg" | "neutral" } =>
  change === null || change === undefined ? { sub: `no data in the previous ${unit}`, subType: "neutral" }
  : change === 0 ? { sub: `same as the previous ${unit}`, subType: "neutral" }
  : { sub: `${Math.abs(change)}% vs previous ${unit}`, subType: change > 0 ? "pos" : "neg" };

const Dashboard: React.FC = () => {
  const d = useDashboard();
  const { data, error, updatedAt, refresh, activeTab, setActiveTab, tabs } = d;

  if (!data) {
    return (
      <div className="content">
        <h1 className="pageTitle">Dashboard</h1>
        <div className="pageSub">{error ? `Couldn't load the dashboard: ${error}` : "Loading…"}</div>
        {error && <button onClick={refresh}>Retry</button>}
      </div>
    );
  }

  const { stats, sessions, topItems, areas, errors } = data;
  const orders = stats.orders;
  const deliveredPct = orders && orders.total > 0 ? Math.round((orders.completed / orders.total) * 100) : null;
  const sessionRows = sessions[activeTab];
  const num = (n: number | null) => (n === null ? "—" : n);
  const days = (new Date(d.range.to).getTime() - new Date(d.range.from).getTime()) / 86400000 + 1;
  const unit = days === 1 ? "day" : `${days} days`;
  const salesTrend = trend(stats.sales?.change, unit);
  const ordersTrend = trend(orders?.change, unit);

  return (
    <div className="content">
      <h1 className="pageTitle">Dashboard</h1>
      <div className="pageSub">Overview of your panel</div>

      <RangeFilters f={d} />

      <div className={`liveBar ${error ? "liveBar--stale" : ""}`}>
        <span>
          {error ? `Showing stale data (refresh failed: ${error})` : "Live"} · updated {updatedAt?.toLocaleTimeString()}
        </span>
        <button onClick={refresh}>Refresh</button>
      </div>
      {errors.length > 0 && <div className="sectionNote">Some sections are unavailable: {errors.join(", ")}</div>}

      <div className={d.loading ? "dim" : undefined}>
        {/* Stats */}
        <section className="statsGrid">
          <StatCard
            title="Sales"
            value={formatMoney(stats.sales?.value ?? null)}
            sub={stats.sales ? salesTrend.sub : "paid orders"}
            subType={stats.sales ? salesTrend.subType : "neutral"}
            icon={<CurrencyIcon className="stat-icon" />}
            iconBg="#e8fff2"
          />
          <StatCard
            title="Orders"
            value={num(orders?.total ?? null)}
            sub={orders ? [ordersTrend.sub, deliveredPct === null ? null : `${deliveredPct}% delivered`].filter(Boolean).join(" · ") : undefined}
            subType={orders ? ordersTrend.subType : "neutral"}
            icon={<ShoppingCartIcon className="stat-icon" />}
            iconBg="#f3f4f6"
          />
          <StatCard
            title="Blocked Users"
            value={num(stats.blockedUsers)}
            sub={stats.blockedUsers ? "Need attention" : "right now"}
            subType={stats.blockedUsers ? "neg" : "neutral"}
            icon={<BanIcon className="stat-icon" />}
            iconBg="#fff1f2"
          />
          <StatCard
            title="Unpaid Orders"
            value={num(stats.unpaidOrders)}
            sub="right now, all dates"
            subType="neutral"
            icon={<AlertIcon className="stat-icon" />}
            iconBg="#fff7ed"
          />
        </section>

        {/* Session Performance (selected range) */}
        <section className="card">
          <div className="card__header">
            <div className="card__title">Session Performance</div>
            <div className="tabs">
              {tabs.map(tab => (
                <button
                  key={tab}
                  className={`tab ${activeTab === tab ? "tab--active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab[0].toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="sessionsGrid">
            {sessionRows?.length === 0 && <div className="sectionNote">No orders in this range</div>}
            {sessionRows?.map(row => (
              <SessionRow key={row.date} date={day(row.date)} orders={row.orderCount} amount={formatMoney(row.totalRevenue)} />
            ))}
          </div>
        </section>

        {/* Top Selling Items (selected range) */}
        <section className="card">
          <div className="card__header"><div className="card__title">Top Selling Items</div></div>
          <div className="topList">
            {topItems?.length === 0 && <div className="sectionNote">No sales in this range</div>}
            {topItems?.map(item => (
              <TopItem key={item.food_name} name={item.food_name} image={item.image_url} revenue={formatMoney(item.total_revenue)} sold={item.total_quantity} />
            ))}
          </div>
        </section>

        {/* Area Performance (selected range) */}
        <section className="card">
          <div className="card__header"><div className="card__title">Area Performance</div></div>
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr><th>Area</th><th>Orders</th><th>Revenue</th><th>Success Rate</th></tr>
              </thead>
              <tbody>
                {areas?.length === 0 && <tr><td colSpan={4} className="sectionNote">No orders in this range</td></tr>}
                {areas?.map(row => {
                  const rate = row.orderCount > 0 ? Math.round((row.completedCount / row.orderCount) * 100) : 0;
                  return (
                    <tr key={row.area_id}>
                      <td>{row.area_name}</td>
                      <td>{row.orderCount}</td>
                      <td>{formatMoney(row.totalRevenue)}</td>
                      <td>
                        <span className={`rate ${rate >= 95 ? "rate--good" : "rate--mid"}`}>{rate}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
