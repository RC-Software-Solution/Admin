import React from "react";
import { Link } from "react-router-dom";
import "../../styles/login.css";
import { SpinnerIcon } from "../../components/common/Icons";
import type { LoginProps } from "../../types/auth";
import { useLogin } from "../../hooks/useAuth";

const Login: React.FC<LoginProps> = ({ setIsLoggedIn }) => {
  const {
    email,
    password,
    error,
    loading,
    setEmail,
    setPassword,
    handleLogin
  } = useLogin(setIsLoggedIn);

  return (
    <div className="loginPage">
      <form className="loginForm" onSubmit={handleLogin}>
        <h2>Admin Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading} className="loginBtn">
          {loading ? (
            <>
              <SpinnerIcon className="spinner" size={20} />
              <span>Logging in...</span>
            </>
          ) : (
            "Login"
          )}
        </button>

        <Link to="/forgot-password">Forgot password?</Link>
      </form>
    </div>
  );
};

export default Login;
