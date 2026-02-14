import React from "react"; 
import Sidebar from "../components/Sidebar/Sidebar";
import Topbar from "../components/Header/Topbar";
import "./layout.css";

interface LayoutProps {
  children?: React.ReactNode;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>; // add this prop
}

const Layout: React.FC<LayoutProps> = ({ children, setIsLoggedIn }) => {
  return (
    <div className="appContainer">
      <Sidebar />
      <div className="contentWrapper">
        {/* Pass setIsLoggedIn to Topbar */}
        <Topbar setIsLoggedIn={setIsLoggedIn} />
        <main className="main">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
