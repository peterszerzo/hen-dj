const colors = require("tailwindcss/colors");

module.exports = {
  mode: "jit",
  purge: {
    content: ["./src/**/*.{html,js,svelte,ts}", "./*.ts"],
    options: {
      keyframes: true,
    },
  },
  darkMode: false,
  theme: {
    extend: {
      colors: {
        gray: colors.trueGray,
      },
    },
  },
  plugins: [],
};
