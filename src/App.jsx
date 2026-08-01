import { BrowserRouter, Routes, Route } from "react-router";
import { AuthProvider } from "./lib/auth";
import { ProtectedRoute } from "./lib/auth";
import Dashboard from "./Pages/Dashboard";
import Login from "./Pages/Login";
import NotFound from "./Pages/NotFound";
import NotAuthorized from "./Pages/NotAuthorized";

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/login"
                        element={<Login />}
                    />
                    <Route
                        path="/unauthorized"
                        element={<NotAuthorized />}
                    />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
