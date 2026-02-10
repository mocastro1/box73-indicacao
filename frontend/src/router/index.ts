import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false, layout: 'blank' }
    },
    {
      path: '/cliente',
      name: 'cliente',
      component: () => import('@/views/cliente/HistoricoView.vue'),
      meta: { requiresAuth: false, layout: 'blank' }
    },
    {
      path: '/',
      component: () => import('@/layouts/DefaultLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'embaixadores',
          name: 'embaixadores',
          component: () => import('@/views/embaixadores/EmbaixadoresView.vue'),
        },
        {
          path: 'mecanicas',
          name: 'mecanicas',
          component: () => import('@/views/mecanicas/MecanicasView.vue'),
        },
        {
          path: 'cupons',
          name: 'cupons',
          component: () => import('@/views/cupons/CuponsView.vue'),
        },
        {
          path: 'validacoes',
          name: 'validacoes',
          component: () => import('@/views/validacoes/ValidacoesView.vue'),
        },
        {
          path: 'usuarios',
          name: 'usuarios',
          component: () => import('@/views/usuarios/UsuariosView.vue'),
          meta: { roles: ['ADMIN'] }
        },
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  auth.init()

  if (to.meta.requiresAuth !== false && !auth.isAuthenticated) {
    next('/login')
  } else if (to.meta.roles && !((to.meta.roles as string[]).includes(auth.user?.role || ''))) {
    next('/')
  } else {
    next()
  }
})

export default router
