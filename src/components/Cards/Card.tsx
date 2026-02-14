import React from "react";
import "../../pages/Dashboard/dashboard.css";

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
  status: "completed" | "pending" | "cancelled";
}

interface TopItemProps {
  img: string;
  name: string;
  price: string;
  sold: number;
}

/* ---------------- COMPONENTS ---------------- */

export const StatCard: React.FC<StatCardProps> = ({ title, value, sub, subType = "pos", icon, iconBg }) => (
  <div className="statCard">
    <div className="statCard__left">
      <div className="statCard__title">{title}</div>
      <div className="statCard__value">{value}</div>
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

export const SessionRow: React.FC<SessionRowProps> = ({ date, orders, amount, status }) => (
  <div className="sessionRow">
    <div className="sessionRow__date">{date}</div>
    <div className="sessionRow__meta">
      <div className="sessionRow__orders">{orders} orders</div>
      <div className="sessionRow__amount">{amount}</div>
    </div>
    <span className={`pill ${status === "completed" ? "pill--ok" : status === "pending" ? "pill--warn" : "pill--cancel"}`}>
      {status}
    </span>
  </div>
);

export const TopItem: React.FC<TopItemProps> = ({ img, name, price, sold }) => (
  <div className="topItem">
    <img className="topItem__img" src={img} alt={name} />
    <div className="topItem__info">
      <div className="topItem__name">{name}</div>
      <div className="topItem__price">{price}</div>
    </div>
    <div className="topItem__sold">{sold} sold</div>
  </div>
);
