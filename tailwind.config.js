/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        obsidian: "#F7F8FC",
        graphite: "#FFFFFF",
        carbon: "#FFF1F3",
        line: "#E7EAF1",
        bone: "#111318",
        ash: "#7C8699",
        steel: "#495266",
        electric: "#E11D48",
        cyan: "#FB7185",
        signal: "#28C76F",
        caution: "#FFB020",
        danger: "#FF5A6B",
      },
    },
  },
  plugins: [],
};
