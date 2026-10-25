import React, { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Topbar from "../components/Header/Topbar";
import { logout } from "../services/auth.service";
import { useIdleLogout } from "../hooks/useIdleLogout";
import "./layout.css";

interface LayoutProps {
  children?: React.ReactNode;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

const Layout: React.FC<LayoutProps> = ({ children, setIsLoggedIn }) => {
  // Below 1024px the sidebar is a drawer; on wider screens this flag has no visual effect.
  const [navOpen, setNavOpen] = useState(false);

  const menuButton = useRef<HTMLButtonElement>(null);

  // Staff leave consoles open on shared machines; sign out after 30 idle minutes.
  const signOut = useCallback(() => {
    logout().finally(() => setIsLoggedIn(false));
  }, [setIsLoggedIn]);
  useIdleLogout(signOut);

  // Escape or a backdrop click hands focus back to the hamburger. A nav link click does not: it navigates.
  const dismiss = () => {
    setNavOpen(false);
    menuButton.current?.focus();
  };

  useEffect(() => {
    if (!navOpen) return;
    document.querySelector<HTMLElement>("#app-sidebar a")?.focus();
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setNavOpen(false);
      menuButton.current?.focus();
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [navOpen]);

  return (
    <div className="appContainer">
      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
      {navOpen && <div className="drawerBackdrop" onClick={dismiss} />}
      <div className="contentWrapper">
        <Topbar setIsLoggedIn={setIsLoggedIn} navOpen={navOpen} menuButtonRef={menuButton} onMenu={() => setNavOpen((o) => !o)} />
        <main className="main">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
