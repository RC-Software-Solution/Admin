import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../services/auth.service";

interface UseLoginReturn {
    email: string;
    password: string;
    error: string;
    loading: boolean;
    setEmail: (email: string) => void;
    setPassword: (password: string) => void;
    handleLogin: (e: React.FormEvent) => void;
}

export const useLogin = (setIsLoggedIn: (value: boolean) => void): UseLoginReturn => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await login(email, password);
            setIsLoggedIn(true);
            localStorage.setItem("isLoggedIn", "true");
            navigate("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        }
        setLoading(false);
    };

    return {
        email,
        password,
        error,
        loading,
        setEmail,
        setPassword,
        handleLogin,
    };
};
