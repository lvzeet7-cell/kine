import type { Config } from "tailwindcss";

/**
 * Design system — les couleurs sont définies UNE SEULE FOIS
 * dans src/app/globals.css (bloc :root). Ce fichier ne fait que les exposer
 * à Tailwind : pour changer la palette, modifiez uniquement globals.css.
 */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      xs: "400px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        paper: token("paper"),
        surface: token("surface"),
        mist: token("mist"),
        line: token("line"),
        ink: token("ink"),
        muted: token("muted"),
        petrol: {
          DEFAULT: token("petrol"),
          deep: token("petrol-deep"),
          soft: token("petrol-soft"),
        },
        sage: {
          DEFAULT: token("sage"),
          deep: token("sage-deep"),
          soft: token("sage-soft"),
        },
        danger: token("danger"),
        warning: { DEFAULT: token("warning"), soft: token("warning-soft") },
        success: token("success"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Échelle typographique (fluide pour les titres)
        display: ["clamp(2.25rem, 1.55rem + 3.1vw, 4rem)", { lineHeight: "1.04", letterSpacing: "-0.03em" }],
        h1: ["clamp(2rem, 1.55rem + 2vw, 3.25rem)", { lineHeight: "1.08", letterSpacing: "-0.025em" }],
        h2: ["clamp(1.625rem, 1.3rem + 1.4vw, 2.5rem)", { lineHeight: "1.12", letterSpacing: "-0.02em" }],
        h3: ["1.1875rem", { lineHeight: "1.35", letterSpacing: "-0.01em" }],
        lead: ["clamp(1.0625rem, 1rem + 0.3vw, 1.25rem)", { lineHeight: "1.6" }],
        body: ["1.0625rem", { lineHeight: "1.7" }],
        small: ["0.9375rem", { lineHeight: "1.6" }],
        micro: ["0.8125rem", { lineHeight: "1.5", letterSpacing: "0.01em" }],
      },
      maxWidth: {
        page: "76rem",
        prose: "40rem",
      },
      borderRadius: {
        // Hiérarchie : contrôles < cartes < grands panneaux < images
        control: "0.75rem",
        card: "1.125rem",
        panel: "1.5rem",
        media: "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(var(--ink) / 0.04), 0 8px 24px -12px rgb(var(--ink) / 0.12)",
        lift: "0 2px 4px rgb(var(--ink) / 0.05), 0 20px 40px -20px rgb(var(--petrol-deep) / 0.28)",
        header: "0 1px 0 rgb(var(--line) / 1), 0 6px 20px -14px rgb(var(--ink) / 0.18)",
      },
      spacing: {
        section: "clamp(4.5rem, 3rem + 6vw, 8rem)",
        "section-sm": "clamp(3.5rem, 2.5rem + 4vw, 5.5rem)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
