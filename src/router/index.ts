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
    path: '/verify-email',
    name: 'VerifyEmail',
    component: () => import('../views/VerifyEmail.vue'),
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: () => import('../views/Leaderboard.vue'),
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('../views/Analytics.vue'),
  },
  {
    path: '/user-management',
    name: 'UserManagement',
    component: () => import('../views/UserManagement.vue'),
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
  const { user, loading, authReady } = useAuth()
  // Wait for authReady to be true
  if (!authReady.value) {
    const unwatch = watch(authReady, (val) => {
      if (val) {
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
    const isEmailVerified = user.value && user.value.emailVerified
    const publicPages = ['/login', '/register', '/verified', '/verify-email']

    // Debug logs
    console.log('Route guard user:', user.value)
    console.log('Route guard isAdmin:', isAdmin)
    console.log('Navigating to:', to.path)

    // Require email verification for all protected pages
    if (isAuthenticated && !isEmailVerified && !publicPages.includes(to.path)) {
      next('/verify-email')
    // Redirect authenticated users away from login/register/verified
    } else if (to.path === '/login' || to.path === '/register' || to.path === '/verified') {
      if (isAuthenticated) {
        next('/profile')
      } else {
        next()
      }
    // Require authentication for all non-public pages
    } else if (!isAuthenticated && !publicPages.includes(to.path)) {
      next('/login')
    // Admin-only routes
    } else if ((to.path === '/admin' || to.path === '/analytics' || to.path === '/user-management') && !isAdmin) {
      next('/player')
    // Authenticated-only route for leaderboard
    } else if (to.path === '/leaderboard' && !isAuthenticated) {
      next('/login')
    } else {
      next()
    }
  }
}) 