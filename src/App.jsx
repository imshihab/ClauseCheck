import { BrowserRouter, Routes, Route } from "react-router";
import Dashboard from "./Pages/Dashboard";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
            </Routes>
        </BrowserRouter>
    );
}
