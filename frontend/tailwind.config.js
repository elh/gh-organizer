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
    // themes: ["light"], // extra components will not fit dark theme style automatically
    themes: ["light", "dark"],
    darkTheme: "dark",
  },
}

