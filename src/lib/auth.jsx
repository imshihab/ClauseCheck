import React, {
    createContext,
    useContext,
    useMemo,
    useState,
} from "react";
import { Navigate, useLocation } from "react-router";

// Session is held in memory + sessionStorage so a hard refresh keeps the
// reviewer signed in. We never consult /api/me from the client — the server
// is the source of truth, and any 401 from a data fetch surfaces inline.

const STORAGE_KEY = "clausecheck.session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    async function login({ id, password }) {
        const res = await fetch("/api/login", {
            method: "POST",
            credentials: "same-origin",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ id, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.error || "Invalid credentials.");
        }
        const u = data.user || { id };
        setUser(u);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        return u;
    }

    async function logout() {
        try {
            await fetch("/api/logout", {
                method: "POST",
                credentials: "same-origin",
            });
        } catch {
            /* ignore network errors on logout */
        }
        setUser(null);
        sessionStorage.removeItem(STORAGE_KEY);
    }

    const value = useMemo(
        () => ({ user, login, logout }),
        [user],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used inside <AuthProvider>");
    }
    return ctx;
}

export function ProtectedRoute({ children }) {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    return children;
}