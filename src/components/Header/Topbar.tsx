import type { Dispatch, RefObject, SetStateAction } from "react";
import { LuMenu } from "react-icons/lu";
import Bell from "./Bell";
import GlobalSearch from "./GlobalSearch";
import UserMenu from "./UserMenu";
import "./topbar.css";

interface TopbarProps {
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
  navOpen: boolean;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  onMenu: () => void;
}

export default function Topbar({ setIsLoggedIn, navOpen, menuButtonRef, onMenu }: TopbarProps) {
  return (
    <header className="topbar">
      <button type="button" ref={menuButtonRef} className="topbar__menu" aria-label="Menu" aria-expanded={navOpen} aria-controls="app-sidebar" onClick={onMenu}>
        <LuMenu aria-hidden="true" />
      </button>
      <GlobalSearch />
      <div className="topbar__right">
        <Bell />
        <UserMenu setIsLoggedIn={setIsLoggedIn} />
      </div>
    </header>
  );
}
