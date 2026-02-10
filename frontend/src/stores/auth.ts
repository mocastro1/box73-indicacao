import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import router from '@/router'

interface User {
  id: string
  nome: string
  email: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isGerente = computed(() => ['ADMIN', 'GERENTE'].includes(user.value?.role || ''))

  function init() {
    const savedToken = localStorage.getItem('box73_token')
    const savedUser = localStorage.getItem('box73_user')
    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
    }
  }

  async function login(email: string, senha: string) {
    const { data } = await api.post('/auth/login', { email, senha })
    token.value = data.access_token
    user.value = data.user
    localStorage.setItem('box73_token', data.access_token)
    localStorage.setItem('box73_user', JSON.stringify(data.user))
    router.push('/')
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('box73_token')
    localStorage.removeItem('box73_user')
    router.push('/login')
  }

  return { user, token, isAuthenticated, isAdmin, isGerente, init, login, logout }
})
