import React from "react";
import "../../Pages/Dashboard/dashboard.css";

/* ---------------- TYPES ---------------- */

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  subType?: "pos" | "neg" | "neutral";
  icon: React.ReactNode;
  iconBg?: string;
}

interface SessionRowProps {
  date: string;
  orders: number;
  amount: string;
}

interface TopItemProps {
  name: string;
  revenue: string;
  sold: number;
}

/* ---------------- COMPONENTS ---------------- */

export const StatCard: React.FC<StatCardProps> = ({ title, value, sub, subType = "pos", icon, iconBg }) => (
  <div className="statCard">
    <div className="statCard__left">
      <div className="statCard__title">{title}</div>
      {/* keyed on the value so a change remounts it and replays the flash animation */}
      <div className="statCard__value statCard__value--flash" key={value}>{value}</div>
      {sub && (
        <div className={`statCard__sub ${subType}`}>
          {subType === "pos" ? "↗ " : subType === "neg" ? "↘ " : ""}
          {sub}
        </div>
      )}
    </div>
    <div className="statCard__icon" style={{ backgroundColor: iconBg || "#eef2ff" }}>
      {icon}
    </div>
  </div>
);

export const SessionRow: React.FC<SessionRowProps> = ({ date, orders, amount }) => (
  <div className="sessionRow">
    <div className="sessionRow__date">{date}</div>
    <div className="sessionRow__meta">
      <div className="sessionRow__orders">{orders} orders</div>
      <div className="sessionRow__amount">{amount}</div>
    </div>
  </div>
);

export const TopItem: React.FC<TopItemProps> = ({ name, revenue, sold }) => (
  <div className="topItem">
    <div className="topItem__info">
      <div className="topItem__name">{name}</div>
      <div className="topItem__price">{revenue}</div>
    </div>
    <div className="topItem__sold">{sold} sold</div>
  </div>
);
