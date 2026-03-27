/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cyan: {
          400: "#00D9FF",
          500: "#00B8D9",
        },
      },
      fontFamily: {
        mono: ['var(--font-mono)', "monospace"],
        sans: ['var(--font-inter)', "sans-serif"],
        space: ['var(--font-space)', "sans-serif"],
        cormorant: ['var(--font-cormorant)', "serif"],
      },
      animation: {
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.1)' },
        }
      }
    },
  },
  plugins: [],
};
