<template>
  <v-layout class="h-screen">
    <!-- Sidebar -->
    <v-navigation-drawer 
      v-model="drawer" 
      :rail="rail" 
      permanent 
      color="#161827"
      theme="dark"
      width="280"
      :rail-width="80"
    >
      <!-- Logo/Header -->
      <div class="pa-4 d-flex align-center justify-center cursor-pointer" 
           @click="rail = !rail"
           style="min-height: 100px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <img v-if="!rail" src="@/assets/LOGO VETORIZADA - BOX73 BRANCA.png" alt="BOX 73" height="56" />
        <v-icon v-else size="40" style="color: #F97316 !important;">mdi-motorbike</v-icon>
      </div>

      <v-divider class="border-white-alpha-10" />

      <!-- Menu Items -->
      <v-list density="compact" nav class="py-4">
        <v-list-item
          v-for="item in menuItems"
          :key="item.to"
          :prepend-icon="item.icon"
          :title="rail ? '' : item.title"
          :to="item.to"
          :active="route.path === item.to"
          color="primary"
          class="rounded-lg mx-2 my-1"
          rounded
        />
      </v-list>

      <!-- Logout -->
      <template v-slot:append>
        <v-list density="compact" nav class="pb-4">
          <v-list-item
            prepend-icon="mdi-logout"
            :title="rail ? '' : 'Sair'"
            @click="auth.logout()"
            color="error"
            class="rounded-lg mx-2"
            rounded
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- Main content -->
    <v-main class="bg-white">
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()
const drawer = ref(true)
const rail = ref(false)

const allMenuItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/', roles: ['ADMIN', 'GERENTE', 'ATENDENTE'] },
  { title: 'Embaixadores', icon: 'mdi-account-group', to: '/embaixadores', roles: ['ADMIN', 'GERENTE', 'ATENDENTE'] },
  { title: 'Regras de Cupom', icon: 'mdi-cog-outline', to: '/mecanicas', roles: ['ADMIN', 'GERENTE'] },
  { title: 'Cupons', icon: 'mdi-ticket-percent', to: '/cupons', roles: ['ADMIN', 'GERENTE', 'ATENDENTE'] },
  { title: 'Validações', icon: 'mdi-check-circle', to: '/validacoes', roles: ['ADMIN', 'GERENTE', 'ATENDENTE'] },
  { title: 'Ganhadores', icon: 'mdi-trophy', to: '/ganhadores', roles: ['ADMIN', 'GERENTE', 'ATENDENTE'] },
  { title: 'Usuários', icon: 'mdi-account-cog', to: '/usuarios', roles: ['ADMIN'] },
]

const menuItems = computed(() => {
  const role = auth.user?.role || ''
  return allMenuItems.filter(item => item.roles.includes(role))
})
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.cursor-pointer:hover {
  background-color: rgba(249, 115, 22, 0.1);
}

:deep(.v-list-item) {
  transition: all 0.2s ease;
  margin-bottom: 2px;
}

:deep(.v-list-item .v-list-item__prepend .v-icon) {
  color: #F97316 !important;
}

:deep(.v-list-item:hover) {
  background-color: rgba(255, 255, 255, 0.08) !important;
}

:deep(.v-list-item--active) {
  background-color: rgba(249, 115, 22, 0.15) !important;
  color: #F97316 !important;
}

:deep(.v-list-item--active::before) {
  background-color: #F97316 !important;
}

:deep(.v-list-item--active .v-list-item__overlay) {
  background-color: transparent !important;
}

:deep(.v-list-item--active .v-list-item__title) {
  color: #F97316 !important;
  font-weight: 600;
}

:deep(.v-list-item--active .v-list-item__prepend .v-icon) {
  color: #F97316 !important;
}

:deep(.v-list-item.v-list-item--active) {
  --v-theme-primary: #F97316;
}

/* Smooth sidebar collapse */
:deep(.v-navigation-drawer) {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
</style>
