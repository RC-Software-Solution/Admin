import React from "react";
import { StatCard, SessionRow, TopItem } from "../../components/Cards/Card";
import "./dashboard.css";
import { useDashboard } from "../../hooks/useDashboard";
import { CurrencyIcon, ShoppingCartIcon, BanIcon, AlertIcon } from "../../components/common/Icons";

const Dashboard: React.FC = () => {
  const { activeTab, setActiveTab, currentSessionData, topItems, areaRows, tabs } = useDashboard();

  return (
    <div className="content">
      <h1 className="pageTitle">Dashboard</h1>
      <div className="pageSub">Overview of your panel</div>

      {/* Stats */}
      <section className="statsGrid">
        <StatCard
          title="Sales Today"
          value="$12,450"
          sub="+12.5%"
          subType="pos"
          icon={<CurrencyIcon className="stat-icon" />}
          iconBg="#e8fff2"
        />
        <StatCard
          title="This Week"
          value="$78,920"
          sub="+8.2%"
          subType="pos"
          icon={<CurrencyIcon className="stat-icon" />}
          iconBg="#eef2ff"
        />
        <StatCard
          title="Orders Today"
          value="342"
          sub="96% delivered"
          subType="neutral"
          icon={<ShoppingCartIcon className="stat-icon" />}
          iconBg="#f3f4f6"
        />
        <StatCard
          title="Blocked Users"
          value="12"
          sub="Need attention"
          subType="neg"
          icon={<BanIcon className="stat-icon" />}
          iconBg="#fff1f2"
        />
        <StatCard
          title="Unpaid Orders"
          value="8"
          sub="$423 total"
          subType="neg"
          icon={<AlertIcon className="stat-icon" />}
          iconBg="#fff7ed"
        />
      </section>

      {/* Session Performance */}
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
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="sessionsGrid">
          {currentSessionData.map((session, idx) => (
            <SessionRow key={idx} {...session} />
          ))}
        </div>
      </section>

      {/* Top Selling Items */}
      <section className="card">
        <div className="card__header"><div className="card__title">Top Selling Items</div></div>
        <div className="topList">
          {topItems.map(item => <TopItem key={item.name} {...item} />)}
        </div>
      </section>

      {/* Area Performance */}
      <section className="card">
        <div className="card__header"><div className="card__title">Area Performance</div></div>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr><th>Area</th><th>Orders</th><th>Revenue</th><th>Success Rate</th></tr>
            </thead>
            <tbody>
              {areaRows.map(row => (
                <tr key={row.area}>
                  <td>{row.area}</td>
                  <td>{row.orders}</td>
                  <td>{row.revenue}</td>
                  <td>
                    <span className={`rate ${row.rate >= 95 ? "rate--good" : "rate--mid"}`}>{row.rate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
