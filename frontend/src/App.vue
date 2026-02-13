<template>
  <v-app>
    <router-view />
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top right"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Fechar</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { useSnackbarStore } from '@/stores/snackbar'
const snackbar = useSnackbarStore()
</script>

<style>
html {
  background-color: #ffffff;
}

body {
  background-color: #ffffff;
  color: #333333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Smooth transitions - applied only to interactive elements */
.v-btn, .v-list-item, .v-card, .v-navigation-drawer {
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

/* Focus styles */
:focus {
  outline: none;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #F97316;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #000000;
}
</style>
