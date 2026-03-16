import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5a67d8',
          50: '#5a67d810',
          100: '#5a67d820',
          500: '#5a67d8',
          600: '#5a67d8',
          700: '#5a67d8',
        },
        secondary: {
          DEFAULT: '#4a5568',
          500: '#4a5568',
        },
        accent: {
          DEFAULT: '#f6ad55',
          500: '#f6ad55',
        },
        background: '#1a202c',
        foreground: '#edf2f7',
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Roboto', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
