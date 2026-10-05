import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif']
      },
      colors: {
        // Identidade "Alem do Palco": azul-marinho #090424 + rosa #ff0040
        navy: '#090424',
        'navy-soft': '#15103c',
        'navy-line': '#2a2355',
        pink: '#ff0040',
        'pink-dark': '#d60036',
        'pink-soft': '#fff0f3',

        // Verde só para status "confirmado" — fora da paleta da marca de propósito,
        // porque confirmação precisa ler diferente de alerta.
        success: '#0f8a53',
        'success-dark': '#0b6b40',
        'success-soft': '#eefaf3',

        // ink = azul-marinho da marca (em vez de preto puro)
        ink: '#090424',
        graphite: '#3a3566',
        ash: '#6f6b92',
        smoke: '#e5e4ee',
        bone: '#f5f5fa',
        paper: '#ffffff'
      },
      boxShadow: {
        'soft-sm': '0 1px 2px 0 rgb(9 4 36 / 0.06)',
        'soft': '0 2px 10px -2px rgb(9 4 36 / 0.10)',
        'soft-lg': '0 12px 40px -8px rgb(9 4 36 / 0.20)'
      },
      aspectRatio: {
        logo: '747 / 106'
      }
    }
  },
  plugins: []
};

export default config;
