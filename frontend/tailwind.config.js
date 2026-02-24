/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#58CC02',      // Duolingo green - main action color
        secondary: '#CE82FF',    // Purple accent - secondary actions
        accent: '#FF9600',       // Orange - streak/special events
        dark: '#131F24',         // Dark background
        surface: '#1A2C34',      // Card surface
        success: '#58CC02',      // Success state (same as primary)
        warning: '#FF9600',      // Warning state (same as accent)
        error: '#EF4444',        // Error state
        muted: '#6B7280',        // Muted text
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        'lg': '0.75rem',
        'xl': '1rem',
      },
      spacing: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
      },
    }
  },
  plugins: [],
};
