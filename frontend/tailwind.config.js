/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Cores Principais */
        primary: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316', // cor principal
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A360A',
          900: '#7C2D12',
        },
        foreground: '#161826',
        'muted-foreground': '#868298',
        success: '#29A368',
        warning: '#F59E38',
        
        /* Superfícies */
        'surface-bg': '#F5F6FA',
        'surface-card': '#FFFFFF',
        'surface-border': '#E2E5EB',
        'surface-secondary': '#F1F3F6',
        
        /* Sidebar */
        'sidebar-bg': '#161827',
        'sidebar-accent': '#282838',
        'sidebar-text': '#84BAC4',
      },
      backgroundColor: {
        primary: '#F97316',
        'surface-bg': '#F5F6FA',
        'surface-secondary': '#F1F3F6',
      },
      borderColor: {
        primary: '#F97316',
        'surface-border': '#E2E5EB',
      },
      textColor: {
        primary: '#F97316',
        foreground: '#161826',
        'muted-foreground': '#868298',
        success: '#29A368',
        warning: '#F59E38',
      },
    },
  },
  plugins: [],
}
