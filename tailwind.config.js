/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './layouts/**/*.{js,ts,jsx,tsx}',
    './content/**/*.{md,mdx}'
  ],
  safelist: [
    'h-screen',
    'min-h-screen',
    'flex-col',
    'justify-between'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
