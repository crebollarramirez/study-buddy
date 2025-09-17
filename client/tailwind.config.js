/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cgray: '#9F9AA4',
        corange: '#E7CFCD',
        cplatinum: '#CFD8D7',
        cgreen: '#B5C9C3',
        cpink: '#CAB1BD',
      },
    },
  },
  plugins: [],
}