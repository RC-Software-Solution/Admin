import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../../styles/login.css";
import { forgotPassword, resetPassword } from "../../services/auth.service";

// Shared shell: one input flow that ends in a message instead of a redirect
function Form({ title, submitLabel, onSubmit, children }: {
  title: string;
  submitLabel: string;
  onSubmit: () => Promise<string>;
  children: React.ReactNode;
}) {
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      setDone(await onSubmit());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="loginPage">
      <form className="loginForm" onSubmit={submit}>
        <h2>{title}</h2>
        {!done && children}
        {error && <div className="error">{error}</div>}
        {done && <p>{done}</p>}
        {!done && (
          <button type="submit" disabled={loading} className="loginBtn">
            {loading ? "Please wait..." : submitLabel}
          </button>
        )}
        <Link to="/login">Back to login</Link>
      </form>
    </div>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  return (
    <Form title="Forgot password" submitLabel="Send reset link" onSubmit={async () => (await forgotPassword(email)).message}>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
    </Form>
  );
}

// Opened from the emailed link: /reset-password?token=...
export function ResetPassword() {
  const token = useSearchParams()[0].get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  return (
    <Form
      title="Set a new password"
      submitLabel="Reset password"
      onSubmit={async () => {
        if (!token) throw new Error("This reset link is missing its token");
        if (password !== confirm) throw new Error("Passwords don't match");
        return (await resetPassword(token, password)).message;
      }}
    >
      <input type="password" placeholder="New password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
      <input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
    </Form>
  );
}
