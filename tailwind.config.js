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
          beige: "#9ed2edff",
          blue: "#424346ff",
          white: "#fff",
        },
      },
      fontFamily: {
        sans: ["'Poppins'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
