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
          beige: "#e3b091",
          blue: "#546e7a",
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
