import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        body: ['"Special Elite"', '"Courier New"', 'monospace'],
        serif: ['"Playfair Display"', 'Georgia', 'serif']
      },
      colors: {
        ink: '#0a0a0a',
        paper: '#f5f1e8',
        bone: '#ece6d6'
      },
      boxShadow: {
        'vintage': '4px 4px 0 0 #0a0a0a',
        'vintage-sm': '2px 2px 0 0 #0a0a0a',
        'vintage-lg': '6px 6px 0 0 #0a0a0a'
      }
    }
  },
  plugins: []
};

export default config;
