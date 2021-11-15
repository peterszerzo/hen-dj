module.exports = {
  plugins: [
    // Some plugins, like postcss-nested, need to run before Tailwind
    require("tailwindcss"),
  ],
};
