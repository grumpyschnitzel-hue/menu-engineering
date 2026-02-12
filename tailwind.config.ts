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
    },
  },
  plugins: [],
}
export default config
