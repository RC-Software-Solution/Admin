import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./sidebar.css";
import { getSession } from "../../services/apiClient";

import {
  MdDashboard,
  MdLocationOn,
  MdTimer,
  MdFastfood,
  MdHistory,
  MdCampaign,
} from "react-icons/md";

import {
  FaUsers,
  FaUserShield,
  FaClipboardList,
  FaTruck,
  FaChartBar,
  FaCog,
} from "react-icons/fa";

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
    { name: "Sessions", icon: <MdTimer />, path: "/sessions" },
    { name: "Food Items", icon: <MdFastfood />, path: "/food-items" },
    { name: "Orders", icon: <FaClipboardList />, path: "/orders" },
    { name: "Delivery Persons", icon: <FaTruck />, path: "/delivery-persons" },
    { name: "Reports", icon: <FaChartBar />, path: "/reports" },
    { name: "Settings", icon: <FaCog />, path: "/settings" },
    { name: "Audit Logs", icon: <MdHistory />, path: "/audit-logs" },
  ].filter((item) => isSuper || item.path !== "/admins");

  const [activeItem, setActiveItem] = useState("Dashboard");

  // Set active item based on current path
  useEffect(() => {
    const currentItem = navItems.find((item) => item.path === location.pathname);
    if (currentItem) {
      setActiveItem(currentItem.name);
    } else {
      // If path doesn't match any, go to Dashboard
      setActiveItem("Dashboard");
      navigate("/dashboard");
    }
  }, [location.pathname]);

  const handleClick = (name: string, path: string) => {
    setActiveItem(name); // highlight active item
    navigate(path); // navigate to the route
  };

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
              handleClick(item.name, item.path);
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
