/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1f6b45", dark: "#16513a", light: "#e6f2eb", ink: "#0f3a25" }
      },
      fontFamily: { sans: ["Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", "sans-serif"] },
      boxShadow: {
        e1: "0 1px 2px rgba(0,0,0,.08), 0 1px 3px 1px rgba(0,0,0,.05)",
        e2: "0 1px 2px rgba(0,0,0,.10), 0 2px 6px 2px rgba(0,0,0,.07)"
      }
    }
  },
  plugins: []
};
