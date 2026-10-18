import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { MdDashboard, MdLocationOn, MdCampaign, MdEventNote, MdRestaurantMenu, MdDeliveryDining, MdAssessment, MdSettings, MdHistory } from "react-icons/md";
import { FaUsers, FaUserShield, FaClipboardList } from "react-icons/fa";
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
  { title: "Overview", items: [{ name: "Dashboard", icon: <MdDashboard />, path: "/dashboard" }] },
  {
    title: "Customers",
    items: [
      { name: "Users", icon: <FaUsers />, path: "/users" },
      { name: "Orders", icon: <FaClipboardList />, path: "/orders" },
      { name: "Notices", icon: <MdCampaign />, path: "/notices" },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Delivery Areas", icon: <MdLocationOn />, path: "/delivery-areas" },
      { name: "Sessions", icon: <MdEventNote />, path: "/sessions" },
      { name: "Food Items", icon: <MdRestaurantMenu />, path: "/food-items" },
      { name: "Delivery Persons", icon: <MdDeliveryDining />, path: "/delivery-persons" },
    ],
  },
  { title: "Insights", items: [{ name: "Reports", icon: <MdAssessment />, path: "/reports" }] },
  {
    title: "Admin",
    items: [
      { name: "Admins", icon: <FaUserShield />, path: "/admins", superOnly: true },
      { name: "Settings", icon: <MdSettings />, path: "/settings", superOnly: true },
      { name: "Audit Logs", icon: <MdHistory />, path: "/audit-logs", superOnly: true },
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
      <div className="sidebar__title">Admin Panel</div>
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
