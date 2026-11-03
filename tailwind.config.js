/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lantern: {
          navy: '#13264d',
          'navy-dark': '#0c1938',
          'navy-light': '#1e3a8a',
          orange: '#f58220',
          'orange-hover': '#ea580c',
          'orange-light': '#fff7ed',
          'orange-border': '#fed7aa',
        },
        cosmic: {
          white: '#ffffff',
          canvas: '#f8fafc',
          card: 'rgba(255, 255, 255, 0.92)',
          border: 'rgba(226, 232, 240, 0.9)',
          cyan: '#0284c7',
          'cyan-light': '#f0f9ff',
          violet: '#7c3aed',
          'violet-light': '#faf5ff',
          amber: '#d97706',
          'amber-light': '#fffbeb',
          emerald: '#059669',
          'emerald-light': '#ecfdf5',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'cosmic-sm': '0 1px 3px 0 rgba(19, 38, 77, 0.05), 0 1px 2px -1px rgba(19, 38, 77, 0.05)',
        'cosmic-md': '0 4px 6px -1px rgba(19, 38, 77, 0.07), 0 2px 4px -2px rgba(19, 38, 77, 0.05)',
        'cosmic-lg': '0 10px 15px -3px rgba(19, 38, 77, 0.08), 0 4px 6px -4px rgba(19, 38, 77, 0.04)',
        'cosmic-glow-orange': '0 0 25px -4px rgba(245, 130, 32, 0.25)',
        'cosmic-glow-cyan': '0 0 25px -4px rgba(2, 132, 199, 0.20)',
      },
    },
  },
  plugins: [],
};
