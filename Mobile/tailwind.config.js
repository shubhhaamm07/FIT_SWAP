module.exports = {
  content: ["./App.tsx", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        white: "rgb(var(--fg) / <alpha-value>)",
        zinc: {
          300: "rgb(var(--subtle) / <alpha-value>)",
          400: "rgb(var(--muted) / <alpha-value>)",
          500: "rgb(var(--muted) / <alpha-value>)",
        },
        brand: "#8658F5",
        lime: "#D9FF70",
        violet: {
          300: "rgb(var(--accent) / <alpha-value>)",
          400: "rgb(var(--accent) / <alpha-value>)",
        },
        emerald: {
          300: "rgb(var(--success) / <alpha-value>)",
          400: "rgb(var(--success) / <alpha-value>)",
        },
        amber: {
          300: "rgb(var(--warning) / <alpha-value>)",
          400: "rgb(var(--warning) / <alpha-value>)",
        },
        red: {
          300: "rgb(var(--danger) / <alpha-value>)",
          400: "rgb(var(--danger) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [
    require("tailwindcss/plugin")(({ addUtilities }) =>
      addUtilities({
        ".font-normal": {
          fontFamily: "Manrope_400Regular",
          fontWeight: "normal",
        },
        ".font-medium": {
          fontFamily: "Manrope_500Medium",
          fontWeight: "normal",
        },
        ".font-semibold": {
          fontFamily: "Manrope_600SemiBold",
          fontWeight: "normal",
        },
        ".font-bold": { fontFamily: "Manrope_700Bold", fontWeight: "normal" },
        ".font-extrabold": {
          fontFamily: "Manrope_800ExtraBold",
          fontWeight: "normal",
        },
        ".font-black": {
          fontFamily: "Manrope_800ExtraBold",
          fontWeight: "normal",
        },
      }),
    ),
  ],
};
