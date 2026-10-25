import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { forgotPassword, resetPassword } from "../../services/auth.service";
import { Alert, Button, Field } from "../../components/ui";
import AuthShell from "./AuthShell";

// Shared shell: one input flow that ends in a message instead of a redirect
function Form({ headline, lede, title, intro, submitLabel, onSubmit, children }: {
  headline: string;
  lede: string;
  title: string;
  intro: string;
  submitLabel: string;
  onSubmit: () => Promise<string>;
  children: React.ReactNode;
}) {
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [loading, setLoading] = useState(false);
  const backRef = useRef<HTMLAnchorElement>(null);

  // The submit button unmounts on success; hand keyboard focus to the way out
  useEffect(() => {
    if (done) backRef.current?.focus();
  }, [done]);

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
    <AuthShell headline={headline} lede={lede} title={title} intro={intro}>
      <form onSubmit={submit}>
        {done ? (
          <Alert tone="success">{done}</Alert>
        ) : (
          <>
            {children}
            {error && <Alert>{error}</Alert>}
            <Button type="submit" variant="primary" className="auth__submit" loading={loading}>
              {submitLabel}
            </Button>
          </>
        )}
        <Link ref={backRef} className="ui-link auth__back" to="/login">
          Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  return (
    <Form
      headline="Locked out? It happens."
      lede="We will email a reset link that works for one hour."
      title="Reset your password"
      intro="Enter your admin email and we will send you a reset link."
      submitLabel="Send reset link"
      onSubmit={async () => (await forgotPassword(email)).message}
    >
      <Field label="Email">
        <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
    </Form>
  );
}

// Opened from the emailed link: /reset-password?token=...
export function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token] = useState(() => params.get("token") ?? "");
  // Drop the token from the address bar so it doesn't linger in history or the Referer header
  useEffect(() => {
    navigate("/reset-password", { replace: true });
  }, [navigate]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  return (
    <Form
      headline="Choose a new password."
      lede="You will use it the next time you sign in."
      title="Set a new password"
      intro="Use at least 6 characters."
      submitLabel="Reset password"
      onSubmit={async () => {
        if (!token) throw new Error("This reset link is missing its token");
        if (password !== confirm) throw new Error("Passwords don't match");
        return (await resetPassword(token, password)).message;
      }}
    >
      <Field label="New password">
        <input type="password" autoComplete="new-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
      </Field>
      <Field label="Confirm password">
        <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </Field>
    </Form>
  );
}
