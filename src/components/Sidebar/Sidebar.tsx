import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { LuCalendarDays, LuChartColumn, LuHistory, LuLayoutDashboard, LuMapPin, LuMegaphone, LuReceiptText, LuShieldCheck, LuSlidersHorizontal, LuTruck, LuUsers, LuUtensils } from "react-icons/lu";
import { getSession } from "../../services/apiClient";
import "./sidebar.css";

interface NavItem {
  name: string;
  icon: ReactNode;
  path: string;
  superOnly?: boolean; // UI gating only; the backend enforces roles
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  { title: "Overview", items: [{ name: "Dashboard", icon: <LuLayoutDashboard />, path: "/dashboard" }] },
  {
    title: "Customers",
    items: [
      { name: "Users", icon: <LuUsers />, path: "/users" },
      { name: "Orders", icon: <LuReceiptText />, path: "/orders" },
      { name: "Notices", icon: <LuMegaphone />, path: "/notices" },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Delivery Areas", icon: <LuMapPin />, path: "/delivery-areas" },
      { name: "Sessions", icon: <LuCalendarDays />, path: "/sessions" },
      { name: "Food Items", icon: <LuUtensils />, path: "/food-items" },
      { name: "Delivery Persons", icon: <LuTruck />, path: "/delivery-persons" },
    ],
  },
  { title: "Insights", items: [{ name: "Reports", icon: <LuChartColumn />, path: "/reports" }] },
  {
    title: "Admin",
    items: [
      { name: "Admins", icon: <LuShieldCheck />, path: "/admins", superOnly: true },
      { name: "Settings", icon: <LuSlidersHorizontal />, path: "/settings", superOnly: true },
      { name: "Audit Logs", icon: <LuHistory />, path: "/audit-logs", superOnly: true },
    ],
  },
];

interface SidebarProps {
  open: boolean; // drawer state below 1024px
  onNavigate: () => void; // called after a link is chosen so the drawer can close
}

export default function Sidebar({ open, onNavigate }: SidebarProps) {
  const isSuper = getSession()?.role === "super_admin";

  return (
    <aside id="app-sidebar" className={`sidebar ${open ? "sidebar--open" : ""}`}>
      <div className="sidebar__brand">
        <i className="sidebar__mark" aria-hidden="true" />
        Admin Panel
      </div>
      <nav className="nav" aria-label="Main">
        {GROUPS.map((g) => {
          const items = g.items.filter((i) => isSuper || !i.superOnly);
          if (items.length === 0) return null;
          return (
            <div key={g.title} className="nav__group">
              <div className="nav__group-title">{g.title}</div>
              {items.map((item) => (
                <NavLink key={item.path} to={item.path} onClick={onNavigate} className={({ isActive }) => `nav__item ${isActive ? "nav__item--active" : ""}`}>
                  <span className="nav__icon" aria-hidden="true">{item.icon}</span>
                  <span className="nav__text">{item.name}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
