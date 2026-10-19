/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'compact': '0px',
      'sm': '600px',     // M3 Medium breakpoint (600dp)
      'md': '840px',     // M3 Expanded breakpoint (840dp)
      'lg': '1200px',    // M3 Large breakpoint (1200dp)
      'xl': '1600px',    // M3 Extra Large breakpoint (1600dp)
    },
    extend: {
      colors: {
        // Material Design 3 Semantic Dark Theme Roles
        m3: {
          surface: '#0a0f16',
          'surface-dim': '#080c12',
          'surface-bright': '#1a2330',
          'surface-container-lowest': '#06090e',
          'surface-container-low': '#0e141c',
          'surface-container': '#131b26',
          'surface-container-high': '#192330',
          'surface-container-highest': '#202c3c',
          'on-surface': '#e1e8f2',
          'on-surface-variant': '#8c99a8',
          outline: '#3d4b5c',
          'outline-variant': '#222d3b',
          
          // Accent Roles (Tone 80 Dark Theme)
          primary: '#00f2fe',
          'on-primary': '#00373b',
          'primary-container': 'rgba(0, 242, 254, 0.12)',
          'on-primary-container': '#70f7ff',

          secondary: '#10b981',
          'on-secondary': '#003824',
          'secondary-container': 'rgba(16, 185, 129, 0.12)',
          'on-secondary-container': '#6ee7b7',

          tertiary: '#f59e0b',
          'on-tertiary': '#452b00',
          'tertiary-container': 'rgba(245, 158, 11, 0.12)',
          'on-tertiary-container': '#fcd34d',

          error: '#ffb4ab',
          'on-error': '#690005',
          'error-container': '#93000a',
          'on-error-container': '#ffdad6',
        }
      },
      fontFamily: {
        ui: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'm3-xs': '4px',
        'm3-sm': '8px',
        'm3-md': '12px',
        'm3-lg': '16px',
        'm3-xl': '28px',
        'm3-full': '9999px',
      },
      boxShadow: {
        'm3-elevation-1': '0px 1px 3px 1px rgba(0, 0, 0, 0.3), 0px 1px 2px 0px rgba(0, 0, 0, 0.4)',
        'm3-elevation-2': '0px 2px 6px 2px rgba(0, 0, 0, 0.35), 0px 1px 2px 0px rgba(0, 0, 0, 0.45)',
        'm3-elevation-3': '0px 4px 8px 3px rgba(0, 0, 0, 0.4), 0px 1px 3px 0px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
