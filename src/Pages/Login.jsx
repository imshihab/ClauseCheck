import React, { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router";
import { Lock, User, ArrowRight, ShieldAlert, ScrollText } from "lucide-react";
import { Button, Card, Input, Title, Subtitle } from "../components/NeoUI";
import { useAuth } from "../lib/auth";

export default function Login() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [id, setId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // If already authenticated, bounce to the dashboard.
    if (user) {
        const dest = location.state?.from?.pathname || "/";
        return <Navigate to={dest} replace />;
    }

    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await login({ id: id.trim(), password });
            const dest = location.state?.from?.pathname || "/";
            navigate(dest, { replace: true });
        } catch (err) {
            setError(err.message || "Login failed.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-neo-bg flex items-center justify-center p-6">
            <div className="w-full max-w-md flex flex-col gap-6">
                {/* Brand header */}
                <header className="flex flex-col items-start gap-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-neo-yellow border-2 border-neo-black p-2 shadow-neo-sm">
                            <ScrollText size={28} strokeWidth={2.5} />
                        </div>
                        <Title className="text-4xl md:text-5xl">
                            ClauseCheck
                        </Title>
                    </div>
                    <Subtitle className="uppercase tracking-widest text-xs font-bold border-l-4 border-neo-black pl-2">
                        Secure access · Reviewer sign-in
                    </Subtitle>
                </header>

                <Card className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                        <Title className="text-3xl">SIGN IN</Title>
                        <Subtitle className="text-sm">
                            Enter your reviewer ID and password to continue.
                        </Subtitle>
                    </div>

                    <form onSubmit={onSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase tracking-widest">
                                Reviewer ID
                            </label>
                            <div className="relative">
                                <User
                                    size={18}
                                    strokeWidth={2.5}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                />
                                <Input
                                    type="text"
                                    autoComplete="username"
                                    required
                                    value={id}
                                    onChange={(e) => setId(e.target.value)}
                                    placeholder="e.g. reviewer-001"
                                    className="pl-10"
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase tracking-widest">
                                Password
                            </label>
                            <div className="relative">
                                <Lock
                                    size={18}
                                    strokeWidth={2.5}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                />
                                <Input
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="••••••••"
                                    className="pl-10"
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="border-2 border-neo-black bg-neo-red text-white p-3 text-sm font-bold flex items-center gap-2">
                                <ShieldAlert
                                    size={16}
                                    strokeWidth={2.5}
                                />
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full mt-2"
                            disabled={submitting || !id || !password}
                        >
                            {submitting ? "CHECKING…" : (
                                <>
                                    CONTINUE <ArrowRight size={20} strokeWidth={3} />
                                </>
                            )}
                        </Button>
                    </form>
                </Card>

                <footer className="text-center text-[10px] font-black uppercase tracking-widest text-neo-black/50">
                    Built for the Intra IUB Legal Tech Hackathon
                </footer>
            </div>
        </div>
    );
}