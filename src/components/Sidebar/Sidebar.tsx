import { useNavigate, useLocation } from "react-router-dom";
import "./sidebar.css";
import { getSession } from "../../services/apiClient";

import { MdDashboard, MdLocationOn, MdCampaign, MdEventNote, MdRestaurantMenu, MdDeliveryDining, MdAssessment, MdSettings, MdHistory } from "react-icons/md";
import { FaUsers, FaUserShield, FaClipboardList } from "react-icons/fa";

const SUPER_ONLY = ["/admins", "/settings", "/audit-logs"];
const SidebarLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isSuper = getSession()?.role === "super_admin";
  const navItems = [
    { name: "Dashboard", icon: <MdDashboard />, path: "/dashboard" },
    { name: "Users", icon: <FaUsers />, path: "/users" },
    { name: "Admins", icon: <FaUserShield />, path: "/admins" },
    { name: "Delivery Areas", icon: <MdLocationOn />, path: "/delivery-areas" },
    { name: "Notices", icon: <MdCampaign />, path: "/notices" },
    { name: "Orders", icon: <FaClipboardList />, path: "/orders" },
    { name: "Sessions", icon: <MdEventNote />, path: "/sessions" },
    { name: "Food Items", icon: <MdRestaurantMenu />, path: "/food-items" },
    { name: "Delivery Persons", icon: <MdDeliveryDining />, path: "/delivery-persons" },
    { name: "Reports", icon: <MdAssessment />, path: "/reports" },
    { name: "Settings", icon: <MdSettings />, path: "/settings" },
    { name: "Audit Logs", icon: <MdHistory />, path: "/audit-logs" },
  ].filter((item) => isSuper || !SUPER_ONLY.includes(item.path));

  const activeItem = navItems.find((item) => item.path === location.pathname)?.name;

  const handleClick = (path: string) => navigate(path);

  return (
    <aside className="sidebar">
      <div className="sidebar__title">Admin Panel</div>

      <nav className="nav">
        {navItems.map((item) => (
          <a
            key={item.name}
            href="#"
            className={`nav__item ${item.name === activeItem ? "nav__item--active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              handleClick(item.path);
            }}
          >
            <span className="nav__icon">{item.icon}</span>
            <span className="nav__text">{item.name}</span>
          </a>
        ))}
      </nav>

      <div className="sidebar__footer">v1.0.0 · Production</div>
    </aside>
  );
};

export default SidebarLayout;
