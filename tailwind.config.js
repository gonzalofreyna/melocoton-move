/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Las claves heredadas continúan activas para todas las páginas.
          blue: "#3E3236",
          beige: "#C9A38F",
          white: "#FFFFFF",
          wine: "#674650",
          ink: "#30292B",
          muted: "#736764",
          cream: "#FFFFFF",
          sand: "#F0EAE4",
          blush: "#EBD9D1",
          line: "#E5DBD3",
        },
      },
      fontFamily: {
        sans: ['"Avenir Next"', '"Helvetica Neue"', "Arial", "sans-serif"],
        display: ['"Iowan Old Style"', '"Baskerville"', '"Palatino Linotype"', "Georgia", "serif"],
      },
      boxShadow: {
        editorial: "0 12px 40px -18px rgba(48, 41, 43, 0.19)",
        "editorial-lg": "0 25px 60px -25px rgba(48, 41, 43, 0.24)",
      },
    },
  },
  // line-clamp se incluye en Tailwind CSS 3.3+
  plugins: [],
};
