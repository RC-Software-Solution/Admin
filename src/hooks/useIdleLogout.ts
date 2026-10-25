import { useEffect } from "react";

const ACTIVITY = ["pointerdown", "pointermove", "keydown", "wheel"] as const;

/** Calls onIdle after `minutes` without input. Also checks when a tab left idle in the background comes back. */
export function useIdleLogout(onIdle: () => void, minutes = 30) {
  useEffect(() => {
    let last = Date.now();
    const touch = () => { last = Date.now(); };
    const check = () => {
      if (Date.now() - last < minutes * 60_000) return;
      last = Date.now(); // don't fire again while the sign-out request is in flight
      onIdle();
    };
    const onVisible = () => { if (!document.hidden) check(); };

    ACTIVITY.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(check, 30_000);
    return () => {
      ACTIVITY.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [onIdle, minutes]);
}
