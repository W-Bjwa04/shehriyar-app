/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
        },
      },
    },
  },
  plugins: [],
};
