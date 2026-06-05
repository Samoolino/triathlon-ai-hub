import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        console: {
          DEFAULT: "hsl(var(--console))",
          elevated: "hsl(var(--console-elevated))",
          sunken: "hsl(var(--console-sunken))",
          line: "hsl(var(--console-line))",
          glow: "hsl(var(--console-glow))",
        },
        state: {
          stable: "hsl(var(--state-stable))",
          stableBg: "hsl(var(--state-stable-bg))",
          warning: "hsl(var(--state-warning))",
          warningBg: "hsl(var(--state-warning-bg))",
          danger: "hsl(var(--state-danger))",
          dangerBg: "hsl(var(--state-danger-bg))",
          info: "hsl(var(--state-info))",
          infoBg: "hsl(var(--state-info-bg))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "scan-flow": {
          "0%": { transform: "translateX(-35%)", opacity: "0.22" },
          "50%": { opacity: "0.55" },
          "100%": { transform: "translateX(35%)", opacity: "0.22" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--console-glow) / 0.6)" },
          "50%": { boxShadow: "0 0 0 8px hsl(var(--console-glow) / 0)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "scan-flow": "scan-flow 8s ease-in-out infinite alternate",
        "fade-up": "fade-up 0.5s ease-out both",
        "sweep": "sweep 6s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      boxShadow: {
        console: "var(--shadow-console)",
        glow: "var(--shadow-glow)",
      },
      backgroundImage: {
        "console-grid": "var(--gradient-console-grid)",
        "command-surface": "var(--gradient-command-surface)",
        "hero-radar": "var(--gradient-hero-radar)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
