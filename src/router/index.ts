import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import LoginForm from '../components/LoginForm.vue'
import { useAuth } from '../composables/useAuth'
import { watch } from 'vue'
import RegisterForm from '../components/RegisterForm.vue'
import Verified from '../views/Verified.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/admin',
    name: 'AdminPanel',
    component: () => import('../views/AdminPanel.vue'),
  },
  {
    path: '/player',
    name: 'QuizPlayer',
    component: () => import('../views/QuizPlayer.vue'),
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: () => import('../components/UserProfile.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginForm,
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterForm,
  },
  {
    path: '/verified',
    name: 'Verified',
    component: Verified,
  },
  {
    path: '/',
    redirect: '/player',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Route guard for authentication
router.beforeEach((to, from, next) => {
  const { user, loading } = useAuth()
  // Wait for auth to finish loading
  if (loading.value) {
    const unwatch = watch(loading, (val) => {
      if (!val) {
        unwatch()
        proceed()
      }
    })
  } else {
    proceed()
  }

  function proceed() {
    const isAuthenticated = !!user.value
    const isAdmin = user.value && 'isAdmin' in user.value && (user.value.isAdmin === true)
    if (to.path === '/login' || to.path === '/register' || to.path === '/verified') {
      if (isAuthenticated && to.path !== '/verified') {
        next('/player')
      } else {
        next()
      }
    } else if (!isAuthenticated) {
      next('/login')
    } else if (to.path === '/admin' && !isAdmin) {
      next('/player')
    } else {
      next()
    }
  }
}) 