import { useNavigate, useLocation } from "react-router-dom";
import "./sidebar.css";
import { getSession } from "../../services/apiClient";

import { MdDashboard, MdLocationOn, MdCampaign } from "react-icons/md";
import { FaUsers, FaUserShield } from "react-icons/fa";

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
  ].filter((item) => isSuper || item.path !== "/admins");

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
