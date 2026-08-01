/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                neo: {
                    bg: "#F5F2EB",
                    black: "#121212",
                    yellow: "#FACC15",
                    blue: "#2563EB",
                    green: "#22C55E",
                    red: "#DC2626",
                    gray: "#D4D4D4",
                },
            },
            boxShadow: {
                neo: "4px 4px 0px 0px #121212",
                "neo-sm": "2px 2px 0px 0px #121212",
                "neo-hover": "6px 6px 0px 0px #121212",
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "ui-monospace", "monospace"],
            },
        },
    },
    plugins: [],
};