import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Tailwind (carrega ANTES do Vuetify para que Vuetify tenha prioridade)
import './assets/tailwind.css'

// Global styles
import './assets/global.css'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

import App from './App.vue'
import router from './router'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'box73Theme',
    themes: {
      box73Theme: {
        dark: false,
        colors: {
          /* Cores Principais */
          primary: '#F97316',              // Laranja
          secondary: '#F1F3F6',            // Cinza Claro
          accent: '#282838',               // Sidebar Accent
          
          /* Estados */
          error: '#D32F2F',
          info: '#F97316',                 // Laranja (Muted Foreground)
          success: '#29A368',              // Verde
          warning: '#F59E38',              // Amarelo
          
          /* Superfícies */
          background: '#F5F6FA',           // Fundo
          surface: '#FFFFFF',              // Cards
          
          /* Texto sobre cores */
          'on-primary': '#FFFFFF',
          'on-secondary': '#161826',
          
          /* Neutros */
          'on-surface': '#161826',
          'on-background': '#161826',
        }
      }
    }
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
