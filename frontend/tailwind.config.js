/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    // extra components will not fit dark theme style automatically. mostly working.
    themes: ["light"],
    // themes: ["light", "dark"],
    // darkTheme: "dark",
  },
}

