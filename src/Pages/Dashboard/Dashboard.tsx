import React from "react";
import { StatCard, SessionRow, TopItem } from "../../components/Cards/Card";
import "./dashboard.css";
import { useDashboard } from "../../hooks/useDashboard";
import { formatMoney } from "../../utils/formatMoney";
import { CurrencyIcon, ShoppingCartIcon, BanIcon, AlertIcon } from "../../components/common/Icons";

const Dashboard: React.FC = () => {
  const { data, error, updatedAt, refresh, activeTab, setActiveTab, tabs } = useDashboard();

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
  const orders = stats.ordersToday;
  const deliveredPct = orders && orders.total > 0 ? Math.round((orders.completed / orders.total) * 100) : null;
  const sessionRows = sessions[activeTab];
  const num = (n: number | null) => (n === null ? "—" : n);

  return (
    <div className="content">
      <h1 className="pageTitle">Dashboard</h1>
      <div className="pageSub">Overview of your panel</div>

      <div className={`liveBar ${error ? "liveBar--stale" : ""}`}>
        <span>
          {error ? `Showing stale data (refresh failed: ${error})` : "Live"} · updated {updatedAt?.toLocaleTimeString()}
        </span>
        <button onClick={refresh}>Refresh</button>
      </div>
      {errors.length > 0 && <div className="sectionNote">Some sections are unavailable: {errors.join(", ")}</div>}

      {/* Stats */}
      <section className="statsGrid">
        <StatCard
          title="Sales Today"
          value={formatMoney(stats.salesToday)}
          sub="paid orders"
          subType="neutral"
          icon={<CurrencyIcon className="stat-icon" />}
          iconBg="#e8fff2"
        />
        <StatCard
          title="This Week"
          value={formatMoney(stats.salesWeek)}
          sub="since Monday"
          subType="neutral"
          icon={<CurrencyIcon className="stat-icon" />}
          iconBg="#eef2ff"
        />
        <StatCard
          title="Orders Today"
          value={num(orders?.total ?? null)}
          sub={deliveredPct === null ? undefined : `${deliveredPct}% delivered`}
          subType="neutral"
          icon={<ShoppingCartIcon className="stat-icon" />}
          iconBg="#f3f4f6"
        />
        <StatCard
          title="Blocked Users"
          value={num(stats.blockedUsers)}
          sub={stats.blockedUsers ? "Need attention" : undefined}
          subType="neg"
          icon={<BanIcon className="stat-icon" />}
          iconBg="#fff1f2"
        />
        <StatCard
          title="Unpaid Orders"
          value={num(stats.unpaidOrders)}
          icon={<AlertIcon className="stat-icon" />}
          iconBg="#fff7ed"
        />
      </section>

      {/* Session Performance (last 7 days) */}
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
          {sessionRows?.length === 0 && <div className="sectionNote">No orders in the last 7 days</div>}
          {sessionRows?.map(day => (
            <SessionRow
              key={day.date}
              date={new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              orders={day.orderCount}
              amount={formatMoney(day.totalRevenue)}
            />
          ))}
        </div>
      </section>

      {/* Top Selling Items (last 7 days) */}
      <section className="card">
        <div className="card__header"><div className="card__title">Top Selling Items</div></div>
        <div className="topList">
          {topItems?.length === 0 && <div className="sectionNote">No sales in the last 7 days</div>}
          {topItems?.map(item => (
            <TopItem key={item.food_name} name={item.food_name} revenue={formatMoney(item.total_revenue)} sold={item.total_quantity} />
          ))}
        </div>
      </section>

      {/* Area Performance (today) */}
      <section className="card">
        <div className="card__header"><div className="card__title">Area Performance (today)</div></div>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr><th>Area</th><th>Orders</th><th>Revenue</th><th>Success Rate</th></tr>
            </thead>
            <tbody>
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
  );
};

export default Dashboard;
