import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Mock credentials - in a real app, this would use an API
const DEFAULT_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const DEFAULT_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

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

        // Simulated delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD) {
            setIsLoggedIn(true);
            localStorage.setItem("isLoggedIn", "true");
            navigate("/dashboard");
        } else {
            setError("Incorrect email or password");
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
