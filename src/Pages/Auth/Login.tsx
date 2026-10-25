import React from "react";
import { Link } from "react-router-dom";
import type { LoginProps } from "../../types/auth";
import { useLogin } from "../../hooks/useAuth";
import { Alert, Button, Field } from "../../components/ui";
import AuthShell from "./AuthShell";

const Login: React.FC<LoginProps> = ({ setIsLoggedIn }) => {
  const { email, password, error, loading, setEmail, setPassword, handleLogin } = useLogin(setIsLoggedIn);

  return (
    <AuthShell
      bars
      headline="Every lunch order, in one place."
      lede="Approve customers, move orders along and chase payments without leaving the page."
      title="Sign in"
      intro="Use your admin email and password."
    >
      <form onSubmit={handleLogin}>
        <Field label="Email">
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Link className="ui-link auth__forgot" to="/forgot-password">
          Forgot password?
        </Link>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" variant="primary" className="auth__submit" loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
};

export default Login;
