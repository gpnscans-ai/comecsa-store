import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f0fa",
          100: "#e3ddf3",
          200: "#c5b9e7",
          300: "#a795db",
          400: "#7259b8",
          500: "#4a3494",
          600: "#2D1B69",
          700: "#241556",
          800: "#1b1043",
          900: "#130b30",
        },
        ink: {
          50: "#f5f6fa",
          100: "#eceef5",
          200: "#dcdfe8",
          700: "#4a4d57",
          800: "#2f313a",
          900: "#222222",
        },
      },
      fontFamily: {
        display: ["var(--font-poppins)", "system-ui", "sans-serif"],
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
