import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { Navigate, useLocation } from "react-router";

/**
 * Tiny session store. We keep only the reviewer's id (returned by /api/me)
 * in memory + sessionStorage so a hard refresh doesn't sign the user out,
 * while the real auth lives in an httpOnly cookie managed by the API.
 */

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
    const [loading, setLoading] = useState(true);

    // On mount, verify the cookie is still valid.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/me", {
                    credentials: "same-origin",
                });
                if (cancelled) return;
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user || null);
                    sessionStorage.setItem(
                        STORAGE_KEY,
                        JSON.stringify(data.user || null),
                    );
                } else {
                    setUser(null);
                    sessionStorage.removeItem(STORAGE_KEY);
                }
            } catch {
                if (!cancelled) setUser(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

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
        () => ({ user, loading, login, logout }),
        [user, loading],
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

/**
 * Wrap any route that requires an authenticated reviewer.
 * While we are still verifying the cookie on mount, render a small placeholder
 * so we don't flash the login page on a hard refresh.
 */
export function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-neo-bg flex items-center justify-center">
                <div className="border-2 border-neo-black bg-white px-5 py-3 shadow-neo font-black uppercase tracking-widest text-sm">
                    Checking session…
                </div>
            </div>
        );
    }

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