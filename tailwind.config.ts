import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#13285a',
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d4fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#13285a',
          600: '#101f48',
          700: '#0d1836',
          800: '#0a1024',
          900: '#070812',
        },
      },
    },
  },
  plugins: [],
}
export default config
