import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./topbar.css";

interface TopbarProps {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

const Topbar: React.FC<TopbarProps> = ({ setIsLoggedIn }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleToggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user"); // if you store user info

    // Update state
    setIsLoggedIn(false);

    // Redirect to login
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="searchWrap">
        <input className="search" placeholder="Search" />
      </div>
      <div className="topbar__right">
        <button className="iconBtn">
          🔔
          <span className="notification-badge">3</span>
        </button>
        <div className="user" onClick={handleToggleDropdown}>
          <div className="user__avatar">👤</div>
          <div className="user__name">Admin User</div>
          <div className="user__caret">▾</div>
          {isDropdownOpen && (
            <div className="user__dropdown">
              <button onClick={handleLogout} className="dropdown__item">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
