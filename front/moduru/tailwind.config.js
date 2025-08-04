/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}", // js,jsx에서 tailwind 적용되게 함
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
