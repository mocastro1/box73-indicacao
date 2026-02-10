<template>
  <v-layout class="h-screen">
    <!-- Sidebar -->
    <v-navigation-drawer v-model="drawer" :rail="rail" permanent color="secondary" theme="dark">
      <v-list-item
        prepend-icon="mdi-motorbike"
        title="Box 73"
        subtitle="Sistema de Indicação"
        nav
        class="my-2"
        @click="rail = !rail"
      />

      <v-divider />

      <v-list density="compact" nav>
        <v-list-item
          v-for="item in menuItems"
          :key="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.to"
          :active="route.path === item.to"
          color="primary"
        />
      </v-list>

      <template v-slot:append>
        <v-list density="compact" nav>
          <v-list-item
            prepend-icon="mdi-logout"
            title="Sair"
            @click="auth.logout()"
            color="error"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- Main content -->
    <v-main class="bg-gray-50">
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
  { title: 'Mecânicas', icon: 'mdi-cog', to: '/mecanicas', roles: ['ADMIN', 'GERENTE'] },
  { title: 'Cupons', icon: 'mdi-ticket-percent', to: '/cupons', roles: ['ADMIN', 'GERENTE', 'ATENDENTE'] },
  { title: 'Validações', icon: 'mdi-check-decagram', to: '/validacoes', roles: ['ADMIN', 'GERENTE', 'ATENDENTE'] },
  { title: 'Usuários', icon: 'mdi-account-cog', to: '/usuarios', roles: ['ADMIN'] },
]

const menuItems = computed(() => {
  const role = auth.user?.role || ''
  return allMenuItems.filter(item => item.roles.includes(role))
})
</script>
