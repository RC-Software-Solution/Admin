import type { ReactNode } from "react";
import "./auth.css";

interface AuthShellProps {
  headline: string;
  lede: string;
  bars?: boolean; // the four-segment motif, shown on sign-in only
  title: string; // the page's h1
  intro: string;
  children: ReactNode;
}

/** The split screen shared by sign-in, forgot password and reset password. */
export default function AuthShell({ headline, lede, bars = false, title, intro, children }: AuthShellProps) {
  return (
    <div className="auth">
      <section className="auth__art">
        <div className="auth__brand">
          <i className="auth__mark" aria-hidden="true" />
          Admin Panel
        </div>
        <div>
          {bars && (
            <div className="auth__bars" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
          )}
          <p className="auth__headline">{headline}</p>
          <p className="auth__lede">{lede}</p>
        </div>
        <p className="auth__foot">Staff access only</p>
      </section>
      <main className="auth__form">
        <div className="auth__box">
          <h1>{title}</h1>
          <p className="auth__intro">{intro}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
