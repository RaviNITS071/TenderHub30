/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dalBlue: {
          DEFAULT: '#0B3D62', 
          800: '#082f4d',
        },
        chinarRed: {
          DEFAULT: '#C1502E', 
          800: '#9b3d20',
        },
        paper: '#F7F5F2',         
        charcoal: '#2B2B2B',      
        successGreen: '#3E7A4E',  
        warningGold: '#D9A441',   
        border: '#E5E0D8',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(11, 61, 98, 0.05), 0 1px 2px 0 rgba(11, 61, 98, 0.03)',
        card: '0 4px 6px -1px rgba(11, 61, 98, 0.05), 0 2px 4px -1px rgba(11, 61, 98, 0.03)',
      }
    },
  },
  plugins: [],
}