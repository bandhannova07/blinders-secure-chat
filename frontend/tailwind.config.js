/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Peaky Blinders dark theme
        'blinders': {
          'black': '#0a0a0a',
          'dark': '#1a1a1a',
          'gray': '#2a2a2a',
          'light-gray': '#3a3a3a',
          'gold': '#d4af37',
          'light-gold': '#f4d03f',
          'red': '#8b0000',
          'light-red': '#dc143c',
          'blue': '#1e3a8a',
          'light-blue': '#3b82f6'
        }
      },
      fontFamily: {
        'blinders': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-gold': 'pulseGold 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 5px #d4af37' },
          '50%': { boxShadow: '0 0 20px #d4af37, 0 0 30px #d4af37' },
        }
      }
    },
  },
  plugins: [],
}
