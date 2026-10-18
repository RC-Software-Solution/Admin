import type { Dispatch, SetStateAction } from "react";
import { MdMenu } from "react-icons/md";
import Bell from "./Bell";
import GlobalSearch from "./GlobalSearch";
import UserMenu from "./UserMenu";
import "./topbar.css";

interface TopbarProps {
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
  navOpen: boolean;
  onMenu: () => void;
}

export default function Topbar({ setIsLoggedIn, navOpen, onMenu }: TopbarProps) {
  return (
    <header className="topbar">
      <button type="button" className="topbar__menu" aria-label="Menu" aria-expanded={navOpen} aria-controls="app-sidebar" onClick={onMenu}>
        <MdMenu aria-hidden="true" />
      </button>
      <GlobalSearch />
      <div className="topbar__right">
        <Bell />
        <UserMenu setIsLoggedIn={setIsLoggedIn} />
      </div>
    </header>
  );
}
