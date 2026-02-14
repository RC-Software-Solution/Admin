export interface LoginProps {
    setIsLoggedIn: (isLoggedIn: boolean) => void;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}
