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
    extend: {
      colors: {
        'ivory': '#FFFFF0',
        'purple': {
          900: '#1A0C2B',  // Color morado oscuro para el texto y logo
        },
      }
    },
  },
  plugins: [],
};
