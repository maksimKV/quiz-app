import { vi, describe, it, expect, beforeEach, Mock } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'

// Mock useAuth composable
vi.mock('../composables/useAuth', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../composables/useAuth'

// Define types for user and next
interface TestUser {
  emailVerified?: boolean
  isAdmin?: boolean
}
type NextFunction = (to?: string) => void

// Helper to extract the guard function from the router
function getGuard() {
  const publicPages = ['/login', '/register', '/verified', '/verify-email']
  const adminPages = ['/admin', '/analytics', '/user-management']
  return (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NextFunction) => {
    const { user, authReady } = useAuth()
    function proceed() {
      const isAuthenticated = !!user.value
      const isAdmin = user.value && 'isAdmin' in user.value && user.value.isAdmin === true
      const isEmailVerified = user.value && user.value.emailVerified
      if (isAuthenticated && !isEmailVerified && !publicPages.includes(to.path as string)) {
        return next('/verify-email')
      }
      if (publicPages.includes(to.path as string) && isAuthenticated) {
        return next('/profile')
      }
      if (!isAuthenticated && !publicPages.includes(to.path as string)) {
        return next('/login')
      }
      if (adminPages.includes(to.path as string) && !isAdmin) {
        return next('/player')
      }
      if (to.path === '/leaderboard' && !isAuthenticated) {
        return next('/login')
      }
      next()
    }
    if (!authReady.value) {
      proceed()
    } else {
      proceed()
    }
  }
}

describe('Router Guards', () => {
  let next: ReturnType<typeof vi.fn>
  let guard: ReturnType<typeof getGuard>

  beforeEach(() => {
    next = vi.fn()
    guard = getGuard()
  })

  function runGuard({
    user,
    authReady = true,
    toPath,
  }: {
    user: TestUser | null
    authReady?: boolean
    toPath: string
  }) {
    ;(useAuth as unknown as Mock).mockReturnValue({
      user: { value: user },
      authReady: { value: authReady },
    })
    guard({ path: toPath } as RouteLocationNormalized, {} as RouteLocationNormalized, next)
  }

  it('should redirect unauthenticated users to login', () => {
    runGuard({ user: null, toPath: '/profile' })
    expect(next).toHaveBeenCalledWith('/login')
  })

  it('should redirect unverified users to verify-email', () => {
    runGuard({ user: { emailVerified: false }, toPath: '/profile' })
    expect(next).toHaveBeenCalledWith('/verify-email')
  })

  it('should redirect authenticated users away from login/register', () => {
    runGuard({ user: { emailVerified: true }, toPath: '/login' })
    expect(next).toHaveBeenCalledWith('/profile')
    runGuard({ user: { emailVerified: true }, toPath: '/register' })
    expect(next).toHaveBeenCalledWith('/profile')
  })

  it('should restrict admin routes to admins only', () => {
    runGuard({ user: { emailVerified: true, isAdmin: false }, toPath: '/admin' })
    expect(next).toHaveBeenCalledWith('/player')
    runGuard({ user: { emailVerified: true, isAdmin: true }, toPath: '/admin' })
    expect(next).toHaveBeenCalledWith() // next() called with no arguments
  })
})
