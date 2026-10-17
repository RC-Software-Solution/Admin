import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession } from "../../services/apiClient";
import { logout } from "../../services/auth.service";
import Bell from "./Bell";
import GlobalSearch from "./GlobalSearch";
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

  const handleLogout = async () => {
    await logout();

    // Update state
    setIsLoggedIn(false);

    // Redirect to login
    navigate("/login");
  };

  return (
    <header className="topbar">
      <GlobalSearch />
      <div className="topbar__right">
        <Bell />
        <div className="user" onClick={handleToggleDropdown}>
          <div className="user__avatar">👤</div>
          <div className="user__name">{getSession()?.name}</div>
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
