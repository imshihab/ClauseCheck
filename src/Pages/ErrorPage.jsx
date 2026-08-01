import React from "react";
import { useNavigate } from "react-router";
import { ShieldAlert, Home, LogIn, ArrowLeft } from "lucide-react";
import { Button, Card, Title, Subtitle } from "../components/NeoUI";
import { useAuth } from "../lib/auth";

/**
 * Reusable neobrutalist error page used for both 404 and unauthenticated cases.
 *
 * Props:
 *  - code: short label shown in a black tag (e.g. "404", "AUTH REQUIRED")
 *  - title: big headline
 *  - message: explanation under the headline
 *  - showBack: whether to show a "Back to dashboard" button when logged in
 */
export default function ErrorPage({
    code = "ERROR",
    title = "SOMETHING WENT WRONG",
    message = "An unexpected error occurred.",
    showBack = true,
}) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-neo-bg flex items-center justify-center p-6">
            <div className="w-full max-w-lg flex flex-col gap-6">
                <Card variant="dark" className="flex flex-col gap-5 items-start">
                    <div className="flex items-center gap-3">
                        <div className="bg-neo-red border-2 border-white p-2 shadow-neo-sm">
                            <ShieldAlert
                                size={28}
                                strokeWidth={2.5}
                                className="text-white"
                            />
                        </div>
                        <span className="px-2 py-1 bg-white text-neo-black border-2 border-white text-xs font-black uppercase tracking-widest">
                            {code}
                        </span>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Title className="text-white text-4xl md:text-5xl">
                            {title}
                        </Title>
                        <Subtitle className="text-white/80 text-base">
                            {message}
                        </Subtitle>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                        {user ? (
                            <>
                                {showBack && (
                                    <Button
                                        variant="primary"
                                        onClick={() => navigate("/", { replace: true })}
                                    >
                                        <Home size={18} strokeWidth={3} /> GO HOME
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        logout();
                                        navigate("/login", { replace: true });
                                    }}
                                >
                                    <LogIn size={18} strokeWidth={3} /> SIGN OUT
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="primary"
                                    onClick={() => navigate("/login", { replace: true })}
                                >
                                    <LogIn size={18} strokeWidth={3} /> SIGN IN
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate(-1)}
                                >
                                    <ArrowLeft size={18} strokeWidth={3} /> GO BACK
                                </Button>
                            </>
                        )}
                    </div>
                </Card>

                <footer className="text-center text-[10px] font-black uppercase tracking-widest text-neo-black/50">
                    Built for the Intra IUB Legal Tech Hackathon
                </footer>
            </div>
        </div>
    );
}