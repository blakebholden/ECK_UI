/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Elastic Cloud UI color scheme
        'elastic-dark': {
          900: '#0A0E14',   // Darkest background
          800: '#0F1419',   // Main background
          700: '#1A1F29',   // Elevated surfaces
          600: '#252A33',   // Borders and dividers
          500: '#343A46',   // Hover states
        },
        'elastic-blue': {
          500: '#36A2EF',   // Primary blue
          600: '#1BA9F5',   // Bright blue for actions
          700: '#0077CC',   // Darker blue
        },
        'elastic-text': {
          primary: '#DFE5EF',    // Primary text
          secondary: '#98A2B3',  // Secondary text
          tertiary: '#69707D',   // Tertiary text
        },
        'elastic-success': '#00BFB3',  // Green for healthy status
        'elastic-warning': '#FEC514',  // Warning yellow
        'elastic-danger': '#BD271E',   // Error red
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
