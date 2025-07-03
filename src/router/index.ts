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
  const { user, authReady } = useAuth()
  const publicPages = ['/login', '/register', '/verified', '/verify-email']
  const adminPages = ['/admin', '/analytics', '/user-management']

  function proceed() {
    const isAuthenticated = !!user.value
    const isAdmin = user.value && 'isAdmin' in user.value && user.value.isAdmin === true
    const isEmailVerified = user.value && user.value.emailVerified

    // Require email verification for all protected pages
    if (isAuthenticated && !isEmailVerified && !publicPages.includes(to.path)) {
      return next('/verify-email')
    }

    // Redirect authenticated users away from login/register/verified
    if (publicPages.includes(to.path) && isAuthenticated) {
      return next('/profile')
    }

    // Require authentication for all non-public pages
    if (!isAuthenticated && !publicPages.includes(to.path)) {
      return next('/login')
    }

    // Admin-only routes
    if (adminPages.includes(to.path) && !isAdmin) {
      return next('/player')
    }

    // Authenticated-only route for leaderboard
    if (to.path === '/leaderboard' && !isAuthenticated) {
      return next('/login')
    }

    // Default: allow navigation
    next()
  }

  if (!authReady.value) {
    const unwatch = watch(authReady, val => {
      if (val) {
        unwatch()
        proceed()
      }
    })
  } else {
    proceed()
  }
})
