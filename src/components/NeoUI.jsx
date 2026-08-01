import React from "react";

// --- BUTTON ---
export const Button = ({
    children,
    variant = "primary",
    size = "md",
    className = "",
    ...props
}) => {
    const base =
        "font-black uppercase tracking-wider transition-transform active:translate-y-[2px] active:translate-x-[2px] active:shadow-neo-sm border-2 border-neo-black shadow-neo flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0";
    const sizes = {
        sm: "px-3 py-2 text-xs",
        md: "px-5 py-3 text-sm",
        lg: "px-6 py-4 text-base",
    };
    const variants = {
        primary: "bg-neo-yellow text-neo-black",
        dark: "bg-neo-black text-white",
        outline: "bg-white text-neo-black",
        blue: "bg-neo-blue text-white",
        green: "bg-neo-green text-white",
        red: "bg-neo-red text-white",
        ghost: "bg-transparent text-neo-black shadow-none border-neo-black",
    };
    return (
        <button
            className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

// --- CARD ---
export const Card = ({ children, variant = "default", className = "", ...props }) => {
    const base = "border-2 border-neo-black p-6";
    const variants = {
        default: "bg-white shadow-neo",
        dark: "bg-neo-black text-white shadow-neo",
        flat: "bg-transparent shadow-none p-0 border-none",
        yellow: "bg-neo-yellow shadow-neo",
    };
    return (
        <div className={`${base} ${variants[variant]} ${className}`} {...props}>
            {children}
        </div>
    );
};

// --- INPUT ---
export const Input = ({ className = "", ...props }) => (
    <input
        className={`w-full bg-white border-2 border-neo-black shadow-neo p-3 font-medium text-base outline-none focus:shadow-neo-hover transition-shadow placeholder:text-neo-black/40 ${className}`}
        {...props}
    />
);

// --- TEXTAREA ---
export const Textarea = ({ className = "", ...props }) => (
    <textarea
        className={`w-full bg-white border-2 border-neo-black shadow-neo p-3 font-medium text-base outline-none focus:shadow-neo-hover transition-shadow resize-none placeholder:text-neo-black/40 ${className}`}
        {...props}
    />
);

// --- SELECT ---
export const Select = ({ className = "", children, ...props }) => (
    <select
        className={`w-full bg-white border-2 border-neo-black shadow-neo p-3 font-bold text-base outline-none focus:shadow-neo-hover transition-shadow appearance-none cursor-pointer ${className}`}
        style={{
            backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23121212' stroke-width='3' stroke-linecap='square'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 1rem center",
            paddingRight: "2.5rem",
        }}
        {...props}
    >
        {children}
    </select>
);

// --- TYPOGRAPHY ---
export const Title = ({ children, className = "" }) => (
    <h1
        className={`text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none ${className}`}
    >
        {children}
    </h1>
);

export const Subtitle = ({ children, className = "" }) => (
    <p
        className={`text-sm md:text-base font-medium text-neo-black/80 ${className}`}
    >
        {children}
    </p>
);

// --- RISK BADGE ---
export const RiskBadge = ({ level, className = "" }) => {
    const map = {
        low: { label: "LOW RISK", bg: "bg-neo-green", text: "text-white" },
        medium: { label: "MEDIUM RISK", bg: "bg-neo-yellow", text: "text-neo-black" },
        high: { label: "HIGH RISK", bg: "bg-neo-red", text: "text-white" },
        not_enough_information: {
            label: "NOT ENOUGH INFO",
            bg: "bg-neo-gray",
            text: "text-neo-black",
        },
    };
    const style = map[level] || map.not_enough_information;
    return (
        <span
            className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-wider border-2 border-neo-black ${style.bg} ${style.text} ${className}`}
        >
            {style.label}
        </span>
    );
};

// --- CATEGORY LABEL ---
export const CategoryLabel = ({ children, className = "" }) => (
    <span
        className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-2 border-neo-black bg-neo-bg text-neo-black ${className}`}
    >
        {children}
    </span>
);

// --- CHECKBOX PILL (for clause-type toggles) ---
export const TogglePill = ({ active, children, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-2 border-neo-black transition-all cursor-pointer ${
            active
                ? "bg-neo-black text-neo-yellow shadow-neo-sm"
                : "bg-white text-neo-black shadow-neo-sm hover:bg-neo-yellow"
        }`}
    >
        {children}
    </button>
);