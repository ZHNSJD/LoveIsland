/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#17111a',
        bg2:      '#1e1422',
        surface:  '#261a2d',
        surf2:    '#2e2037',
        rose:     '#d4607a',
        'rose-lt':'#e8849c',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        ui:      ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        panel: '22px',
        card:  '18px',
        nav:   '12px',
      }
    }
  },
  plugins: []
}
