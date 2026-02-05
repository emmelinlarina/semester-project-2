export default {
  content: ["./*.html", "./script/**/*.js"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        serif: ["Radley", "Rasa", "poppins", "serif"],
      },
      colors: {
        brand: {
          500: "#4f46e5",
          600: "#4338ca",
        },
      },
    },
  },
  plugins: [],
};
