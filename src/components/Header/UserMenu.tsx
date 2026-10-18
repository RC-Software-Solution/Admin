import { useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { MdKeyboardArrowDown } from "react-icons/md";
import { getSession } from "../../services/apiClient";
import { logout } from "../../services/auth.service";
import { useDismiss } from "../../hooks/useDismiss";

interface UserMenuProps {
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
}

export default function UserMenu({ setIsLoggedIn }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useDismiss(open, box, () => setOpen(false));
  const name = getSession()?.name ?? "Admin";

  const handleLogout = async () => {
    await logout();
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <div className="user" ref={box}>
      <button type="button" className="user__trigger" aria-label={`Account menu, ${name}`} aria-expanded={open} aria-controls="user-menu-panel" onClick={() => setOpen((o) => !o)}>
        <span className="user__avatar" aria-hidden="true">{name.trim().charAt(0).toUpperCase()}</span>
        <span className="user__name">{name}</span>
        <MdKeyboardArrowDown className="user__caret" aria-hidden="true" />
      </button>
      {open && (
        <div id="user-menu-panel" className="user__dropdown">
          <button type="button" className="dropdown__item" onClick={handleLogout}>Log out</button>
        </div>
      )}
    </div>
  );
}
