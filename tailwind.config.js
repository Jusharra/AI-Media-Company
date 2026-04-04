/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Admin fonts
        heading: ['var(--font-bebas-neue)', 'sans-serif'],
        mono:    ['var(--font-ibm-plex-mono)', 'monospace'],
        body:    ['var(--font-lora)', 'serif'],
        // Public fonts
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        serif:   ['var(--font-source-serif)', 'Georgia', 'serif'],
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#09090b',
        stone: {
          50:  '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          800: '#292524',
          900: '#1c1917',
        },
        amber: {
          600: '#d97706',
          700: '#b45309',
        },
      },
    },
  },
  plugins: [],
};
