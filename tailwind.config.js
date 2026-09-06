/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        badminton: {
          green: '#1a9f60',
          court: '#2d3748',
          line: '#ffffff',
        },
      },
    },
  },
  plugins: [],
};
