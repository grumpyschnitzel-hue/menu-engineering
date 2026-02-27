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
        navy: {
          DEFAULT: '#0A1628',
          light: '#0E1B30',
          card: '#111E35',
          border: '#1A2D4D',
        },
        gold: {
          DEFAULT: '#D4AF37',
          dim: '#B89630',
        },
        blue: '#00A6D6',
        steel: '#6B7280',
        classification: {
          star: '#D4AF37',
          plowhorse: '#3B82F6',
          puzzle: '#8B5CF6',
          dog: '#6B7280',
        },
      },
      fontFamily: {
        display: ['Oswald', 'Arial Narrow', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideOutRight: {
          from: { opacity: '1', transform: 'translateX(0)' },
          to: { opacity: '0', transform: 'translateX(100%)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        slideInRight: 'slideInRight 0.3s ease-out',
        slideOutRight: 'slideOutRight 0.3s ease-in forwards',
      },
    },
  },
  plugins: [],
}
export default config
