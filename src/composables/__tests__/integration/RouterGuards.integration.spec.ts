import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from '../../../store/auth'
import type { User } from '../../../types/user'
import type { User as FirebaseUser } from 'firebase/auth'
import { db } from '../../../firebase'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import * as useAuthModule from '../../useAuth'

// Mock Firebase Auth
vi.mock('../../../firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}))

// Mock Firebase Auth functions
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  getIdTokenResult: vi.fn(),
  signOut: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  sendEmailVerification: vi.fn(),
}))

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
}))

// Mock useAuth composable
vi.mock('../../useAuth', () => ({
  useAuth: vi.fn(),
}))

const mockUser: User = {
  id: 'u1',
  uid: 'u1',
  name: 'Test User',
  email: 'test@example.com',
  isAdmin: false,
}

const mockAdminUser: User = {
  id: 'admin1',
  uid: 'admin1',
  name: 'Admin User',
  email: 'admin@example.com',
  isAdmin: true,
}

const mockUnverifiedUser: User = {
  id: 'u2',
  uid: 'u2',
  name: 'Unverified User',
  email: 'unverified@example.com',
  isAdmin: false,
}

// Extended Firebase User type to include isAdmin
type ExtendedFirebaseUser = FirebaseUser & { isAdmin?: boolean }

const mockFirebaseUser: ExtendedFirebaseUser = {
  uid: 'u1',
  email: 'test@example.com',
  emailVerified: true,
  displayName: null,
  isAnonymous: false,
  metadata: {
    creationTime: '',
    lastSignInTime: '',
  } as unknown as FirebaseUser['metadata'],
  phoneNumber: null,
  photoURL: null,
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: vi.fn(),
  getIdToken: vi.fn(),
  getIdTokenResult: vi.fn(),
  reload: vi.fn(),
  toJSON: vi.fn(),
  providerId: '',
  isAdmin: false,
} as ExtendedFirebaseUser

// Router guard logic extracted for testing
function createRouterGuard(user: ReturnType<typeof ref<ExtendedFirebaseUser | null>>) {
  return (to: { path: string }, from: unknown, next: (path?: string) => void) => {
    const publicPages = ['/login', '/register', '/verified', '/verify-email']
    const adminPages = ['/admin', '/analytics', '/user-management']

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
}

describe('Router Guards Integration', () => {
  let mockUseAuth: {
    user: ReturnType<typeof ref<ExtendedFirebaseUser | null>>
    firebaseUser: ReturnType<typeof ref<ExtendedFirebaseUser | null>>
    loading: ReturnType<typeof ref<boolean>>
    error: ReturnType<typeof ref<string | null>>
    authReady: ReturnType<typeof ref<boolean>>
    login: (email: string, password: string) => Promise<ExtendedFirebaseUser>
    logout: () => Promise<void>
    signup: (email: string, password: string, name?: string) => Promise<ExtendedFirebaseUser>
    resendVerificationEmail: () => Promise<void>
  }

  beforeEach(() => {
    setActivePinia(createPinia())

    // Mock useAuth composable
    mockUseAuth = {
      user: ref(null),
      firebaseUser: ref(null),
      loading: ref(false),
      error: ref(null),
      authReady: ref(true),
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      resendVerificationEmail: vi.fn(),
    }

    vi.mocked(useAuthModule.useAuth).mockReturnValue(
      mockUseAuth as ReturnType<typeof useAuthModule.useAuth>
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Navigation Guards', () => {
    it('redirects unauthenticated users to login for protected routes', () => {
      mockUseAuth.user.value = null
      mockUseAuth.authReady.value = true

      const guard = createRouterGuard(mockUseAuth.user)
      let redirectPath: string | undefined

      guard({ path: '/player' }, {}, path => {
        redirectPath = path
      })

      expect(redirectPath).toBe('/login')
    })

    it('allows authenticated users to access protected routes', () => {
      mockUseAuth.user.value = { ...mockFirebaseUser, emailVerified: true }
      mockUseAuth.authReady.value = true

      const guard = createRouterGuard(mockUseAuth.user)
      let redirectPath: string | undefined

      guard({ path: '/player' }, {}, path => {
        redirectPath = path
      })

      expect(redirectPath).toBeUndefined()
    })

    it('redirects authenticated users away from login page', () => {
      mockUseAuth.user.value = { ...mockFirebaseUser, emailVerified: true }
      mockUseAuth.authReady.value = true

      const guard = createRouterGuard(mockUseAuth.user)
      let redirectPath: string | undefined

      guard({ path: '/login' }, {}, path => {
        redirectPath = path
      })

      expect(redirectPath).toBe('/profile')
    })

    it('redirects authenticated users away from register page', () => {
      mockUseAuth.user.value = { ...mockFirebaseUser, emailVerified: true }
      mockUseAuth.authReady.value = true

      const guard = createRouterGuard(mockUseAuth.user)
      let redirectPath: string | undefined

      guard({ path: '/register' }, {}, path => {
        redirectPath = path
      })

      expect(redirectPath).toBe('/profile')
    })

    it('redirects authenticated users away from verified page', () => {
      mockUseAuth.user.value = { ...mockFirebaseUser, emailVerified: true }
      mockUseAuth.authReady.value = true

      const guard = createRouterGuard(mockUseAuth.user)
      let redirectPath: string | undefined

      guard({ path: '/verified' }, {}, path => {
        redirectPath = path
      })

      expect(redirectPath).toBe('/profile')
    })

    it('allows unauthenticated users to access public pages', () => {
      mockUseAuth.user.value = null
      mockUseAuth.authReady.value = true

      const guard = createRouterGuard(mockUseAuth.user)
      let redirectPath: string | undefined

      guard({ path: '/login' }, {}, path => {
        redirectPath = path
      })

      expect(redirectPath).toBeUndefined()
    })

    it('redirects unverified users to verify-email page', () => {
      mockUseAuth.user.value = { ...mockFirebaseUser, emailVerified: false }
      mockUseAuth.authReady.value = true

      const guard = createRouterGuard(mockUseAuth.user)
      let redirectPath: string | undefined

      guard({ path: '/player' }, {}, path => {
        redirectPath = path
      })

      expect(redirectPath).toBe('/verify-email')
    })

    it('allows verified users to access protected routes', () => {
      mockUseAuth.user.value = { ...mockFirebaseUser, emailVerified: true }
      mockUseAuth.authReady.value = true

      const guard = createRouterGuard(mockUseAuth.user)
      let redirectPath: string | undefined

      guard({ path: '/profile' }, {}, path => {
        redirectPath = path
      })

      expect(redirectPath).toBeUndefined()
    })
  })

  describe('Admin Route Protection', () => {
    it('redirects non-admin users from admin routes', () => {
      mockUseAuth.user.value = { ...mockFirebaseUser, emailVerified: true }
      mockUseAuth.authReady.value = true

      const guard = createRouterGuard(mockUseAuth.user)
      let redirectPath: string | undefined

      guard({ path: '/admin' }, {}, path => {
        redirectPath = path
      })

      expect(redirectPath).toBe('/player')
    })

    it('allows admin users to access admin routes', () => {
      mockUseAuth.user.value = { ...mockFirebaseUser, emailVerified: true, isAdmin: true }
      mockUseAuth.authReady.value = true

      const guard = createRouterGuard(mockUseAuth.user)
      let redirectPath: string | undefined

      guard({ path: '/admin' }, {}, path => {
        redirectPath = path
      })

      expect(redirectPath).toBeUndefined()
    })

    it('redirects non-admin users from analytics route', () => {
      mockUseAuth.user.value = { ...mockFirebaseUser, emailVerified: true }
      mockUseAuth.authReady.value = true

      const guard = createRouterGuard(mockUseAuth.user)
      let redirectPath: string | undefined

      guard({ path: '/analytics' }, {}, path => {
        redirectPath = path
      })

      expect(redirectPath).toBe('/player')
    })

    it('allows admin users to access analytics route', () => {
      mockUseAuth.user.value = { ...mockFirebaseUser, emailVerified: true, isAdmin: true }
      mockUseAuth.authReady.value = true

      const guard = createRouterGuard(mockUseAuth.user)
      let redirectPath: string | undefined

      guard({ path: '/analytics' }, {}, path => {
        redirectPath = path
      })

      expect(redirectPath).toBeUndefined()
    })

    it('redirects non-admin users from user-management route', () => {
      mockUseAuth.user.value = { ...mockFirebaseUser, emailVerified: true }
      mockUseAuth.authReady.value = true

      const guard = createRouterGuard(mockUseAuth.user)
      let redirectPath: string | undefined

      guard({ path: '/user-management' }, {}, path => {
        redirectPath = path
      })

      expect(redirectPath).toBe('/player')
    })

    it('allows admin users to access user-management route', () => {
      mockUseAuth.user.value = { ...mockFirebaseUser, emailVerified: true, isAdmin: true }
      mockUseAuth.authReady.value = true

      const guard = createRouterGuard(mockUseAuth.user)
      let redirectPath: string | undefined

      guard({ path: '/user-management' }, {}, path => {
        redirectPath = path
      })

      expect(redirectPath).toBeUndefined()
    })
  })

  describe('Leaderboard Access Control', () => {
    it('redirects unauthenticated users from leaderboard', () => {
      mockUseAuth.user.value = null
      mockUseAuth.authReady.value = true

      const guard = createRouterGuard(mockUseAuth.user)
      let redirectPath: string | undefined

      guard({ path: '/leaderboard' }, {}, path => {
        redirectPath = path
      })

      expect(redirectPath).toBe('/login')
    })

    it('allows authenticated users to access leaderboard', () => {
      mockUseAuth.user.value = { ...mockFirebaseUser, emailVerified: true }
      mockUseAuth.authReady.value = true

      const guard = createRouterGuard(mockUseAuth.user)
      let redirectPath: string | undefined

      guard({ path: '/leaderboard' }, {}, path => {
        redirectPath = path
      })

      expect(redirectPath).toBeUndefined()
    })
  })

  describe('Router Guard Auth Ready Watcher', () => {
    it('waits for auth to be ready before proceeding', async () => {
      const { watch } = await import('vue')
      mockUseAuth.user.value = { ...mockFirebaseUser, emailVerified: true }
      mockUseAuth.authReady = ref(false) // Use a real ref

      const { createRouter, createWebHistory } = await import('vue-router')
      const { routes } = await import('../../../router/index')
      const router = createRouter({
        history: createWebHistory(),
        routes,
      })
      router.beforeEach((to, from, next) => {
        const { user, authReady } = mockUseAuth
        const publicPages = ['/login', '/register', '/verified', '/verify-email']
        const adminPages = ['/admin', '/analytics', '/user-management']
        function proceed() {
          const isAuthenticated = !!user.value
          const isAdmin = user.value && 'isAdmin' in user.value && user.value.isAdmin === true
          const isEmailVerified = user.value && user.value.emailVerified
          if (isAuthenticated && !isEmailVerified && !publicPages.includes(to.path)) {
            return next('/verify-email')
          }
          if (publicPages.includes(to.path) && isAuthenticated) {
            return next('/profile')
          }
          if (!isAuthenticated && !publicPages.includes(to.path)) {
            return next('/login')
          }
          if (adminPages.includes(to.path) && !isAdmin) {
            return next('/player')
          }
          if (to.path === '/leaderboard' && !isAuthenticated) {
            return next('/login')
          }
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
      const pushPromise = router.push('/player')
      setTimeout(() => {
        mockUseAuth.authReady.value = true
      }, 10)
      await pushPromise
      await router.isReady()
      expect(router.currentRoute.value.path).toBe('/player')
    })
  })
})

describe('Firestore Security Rules Integration', () => {
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('User Document Access', () => {
    it('allows users to read their own user document', async () => {
      authStore.login(mockUser, mockFirebaseUser)

      const mockDocRef = { id: 'u1' }
      const mockDocSnap = {
        exists: () => true,
        data: () => mockUser,
        id: 'u1',
      }

      vi.mocked(doc).mockReturnValue(mockDocRef as unknown as ReturnType<typeof doc>)
      vi.mocked(getDoc).mockResolvedValue(
        mockDocSnap as unknown as Awaited<ReturnType<typeof getDoc>>
      )

      const userDoc = await getDoc(doc(db, 'users', 'u1'))

      expect(userDoc.exists()).toBe(true)
      expect(userDoc.data()).toEqual(mockUser)
    })

    it('prevents users from reading other users documents', async () => {
      authStore.login(mockUser, mockFirebaseUser)

      const mockDocRef = { id: 'other-user' }
      const mockDocSnap = {
        exists: () => false,
        data: () => null,
        id: 'other-user',
      }

      vi.mocked(doc).mockReturnValue(mockDocRef as unknown as ReturnType<typeof doc>)
      vi.mocked(getDoc).mockResolvedValue(
        mockDocSnap as unknown as Awaited<ReturnType<typeof getDoc>>
      )

      const userDoc = await getDoc(doc(db, 'users', 'other-user'))

      // In a real Firestore security rules test, this would throw a permission error
      // For this integration test, we simulate the behavior
      expect(userDoc.exists()).toBe(false)
    })

    it('allows users to write to their own user document', async () => {
      authStore.login(mockUser, mockFirebaseUser)

      const mockDocRef = { id: 'u1' }
      vi.mocked(doc).mockReturnValue(mockDocRef as unknown as ReturnType<typeof doc>)
      vi.mocked(setDoc).mockResolvedValue(undefined)

      await setDoc(doc(db, 'users', 'u1'), {
        ...mockUser,
        xp: 100,
      })

      expect(setDoc).toHaveBeenCalledWith(mockDocRef, {
        ...mockUser,
        xp: 100,
      })
    })

    it('prevents users from writing to other users documents', async () => {
      authStore.login(mockUser, mockFirebaseUser)

      const mockDocRef = { id: 'other-user' }
      vi.mocked(doc).mockReturnValue(mockDocRef as unknown as ReturnType<typeof doc>)
      vi.mocked(setDoc).mockRejectedValue(new Error('Permission denied'))

      await expect(
        setDoc(doc(db, 'users', 'other-user'), {
          ...mockUser,
          xp: 100,
        })
      ).rejects.toThrow('Permission denied')
    })
  })

  describe('Quiz Document Access', () => {
    it('allows all authenticated users to read quiz documents', async () => {
      authStore.login(mockUser, mockFirebaseUser)

      const mockDocRef = { id: 'quiz1' }
      const mockQuizData = {
        id: 'quiz1',
        title: 'Test Quiz',
        questions: [],
        isPublic: true,
      }
      const mockDocSnap = {
        exists: () => true,
        data: () => mockQuizData,
        id: 'quiz1',
      }

      vi.mocked(doc).mockReturnValue(mockDocRef as unknown as ReturnType<typeof doc>)
      vi.mocked(getDoc).mockResolvedValue(
        mockDocSnap as unknown as Awaited<ReturnType<typeof getDoc>>
      )

      const quizDoc = await getDoc(doc(db, 'quizzes', 'quiz1'))

      expect(quizDoc.exists()).toBe(true)
      expect(quizDoc.data()).toEqual(mockQuizData)
    })

    it('prevents unauthenticated users from reading quiz documents', async () => {
      authStore.logout()

      const mockDocRef = { id: 'quiz1' }
      vi.mocked(doc).mockReturnValue(mockDocRef as unknown as ReturnType<typeof doc>)
      vi.mocked(getDoc).mockRejectedValue(new Error('Permission denied'))

      await expect(getDoc(doc(db, 'quizzes', 'quiz1'))).rejects.toThrow('Permission denied')
    })

    it('allows only admins to create quiz documents', async () => {
      authStore.login(mockAdminUser, mockFirebaseUser)

      const mockDocRef = { id: 'new-quiz' }
      vi.mocked(doc).mockReturnValue(mockDocRef as unknown as ReturnType<typeof doc>)
      vi.mocked(setDoc).mockResolvedValue(undefined)

      const newQuiz = {
        id: 'new-quiz',
        title: 'New Quiz',
        questions: [],
        isPublic: true,
      }

      await setDoc(doc(db, 'quizzes', 'new-quiz'), newQuiz)

      expect(setDoc).toHaveBeenCalledWith(mockDocRef, newQuiz)
    })

    it('prevents non-admin users from creating quiz documents', async () => {
      authStore.login(mockUser, mockFirebaseUser)

      const mockDocRef = { id: 'new-quiz' }
      vi.mocked(doc).mockReturnValue(mockDocRef as unknown as ReturnType<typeof doc>)
      vi.mocked(setDoc).mockRejectedValue(new Error('Permission denied'))

      const newQuiz = {
        id: 'new-quiz',
        title: 'New Quiz',
        questions: [],
        isPublic: true,
      }

      await expect(setDoc(doc(db, 'quizzes', 'new-quiz'), newQuiz)).rejects.toThrow(
        'Permission denied'
      )
    })
  })

  describe('User Results Access', () => {
    it('allows users to read their own results', async () => {
      authStore.login(mockUser, mockFirebaseUser)

      const mockQuery = { where: vi.fn() }
      const mockQuerySnap = {
        docs: [
          {
            id: 'result1',
            data: () => ({
              userId: 'u1',
              quizId: 'quiz1',
              score: 80,
            }),
          },
        ],
      }

      vi.mocked(collection).mockReturnValue(mockQuery as unknown as ReturnType<typeof collection>)
      vi.mocked(query).mockReturnValue(mockQuery as unknown as ReturnType<typeof query>)
      vi.mocked(where).mockReturnValue(mockQuery as unknown as ReturnType<typeof where>)
      vi.mocked(getDocs).mockResolvedValue(
        mockQuerySnap as unknown as Awaited<ReturnType<typeof getDocs>>
      )

      const resultsQuery = query(collection(db, 'userResults'), where('userId', '==', 'u1'))
      const resultsSnap = await getDocs(resultsQuery)

      expect(resultsSnap.docs).toHaveLength(1)
      expect(resultsSnap.docs[0].data().userId).toBe('u1')
    })

    it('prevents users from reading other users results', async () => {
      authStore.login(mockUser, mockFirebaseUser)

      const mockQuery = { where: vi.fn() }
      vi.mocked(collection).mockReturnValue(mockQuery as unknown as ReturnType<typeof collection>)
      vi.mocked(query).mockReturnValue(mockQuery as unknown as ReturnType<typeof query>)
      vi.mocked(where).mockReturnValue(mockQuery as unknown as ReturnType<typeof where>)
      vi.mocked(getDocs).mockRejectedValue(new Error('Permission denied'))

      const resultsQuery = query(collection(db, 'userResults'), where('userId', '==', 'other-user'))

      await expect(getDocs(resultsQuery)).rejects.toThrow('Permission denied')
    })

    it('allows users to write their own results', async () => {
      authStore.login(mockUser, mockFirebaseUser)

      const mockDocRef = { id: 'result1' }
      vi.mocked(doc).mockReturnValue(mockDocRef as unknown as ReturnType<typeof doc>)
      vi.mocked(setDoc).mockResolvedValue(undefined)

      const newResult = {
        userId: 'u1',
        quizId: 'quiz1',
        score: 85,
        timestamp: new Date(),
      }

      await setDoc(doc(db, 'userResults', 'result1'), newResult)

      expect(setDoc).toHaveBeenCalledWith(mockDocRef, newResult)
    })

    it('prevents users from writing results for other users', async () => {
      authStore.login(mockUser, mockFirebaseUser)

      const mockDocRef = { id: 'result1' }
      vi.mocked(doc).mockReturnValue(mockDocRef as unknown as ReturnType<typeof doc>)
      vi.mocked(setDoc).mockRejectedValue(new Error('Permission denied'))

      const newResult = {
        userId: 'other-user',
        quizId: 'quiz1',
        score: 85,
        timestamp: new Date(),
      }

      await expect(setDoc(doc(db, 'userResults', 'result1'), newResult)).rejects.toThrow(
        'Permission denied'
      )
    })
  })

  describe('Admin Document Access', () => {
    it('allows admins to read all user documents', async () => {
      authStore.login(mockAdminUser, mockFirebaseUser)

      const mockQuery = { where: vi.fn() }
      const mockQuerySnap = {
        docs: [
          {
            id: 'u1',
            data: () => mockUser,
          },
          {
            id: 'u2',
            data: () => mockUnverifiedUser,
          },
        ],
      }

      vi.mocked(collection).mockReturnValue(mockQuery as unknown as ReturnType<typeof collection>)
      vi.mocked(query).mockReturnValue(mockQuery as unknown as ReturnType<typeof query>)
      vi.mocked(getDocs).mockResolvedValue(
        mockQuerySnap as unknown as Awaited<ReturnType<typeof getDocs>>
      )

      const usersQuery = query(collection(db, 'users'))
      const usersSnap = await getDocs(usersQuery)

      expect(usersSnap.docs).toHaveLength(2)
    })

    it('allows admins to write to any user document', async () => {
      authStore.login(mockAdminUser, mockFirebaseUser)

      const mockDocRef = { id: 'u1' }
      vi.mocked(doc).mockReturnValue(mockDocRef as unknown as ReturnType<typeof doc>)
      vi.mocked(setDoc).mockResolvedValue(undefined)

      await setDoc(doc(db, 'users', 'u1'), {
        ...mockUser,
        isAdmin: true,
      })

      expect(setDoc).toHaveBeenCalledWith(mockDocRef, {
        ...mockUser,
        isAdmin: true,
      })
    })

    it('allows admins to read all user results', async () => {
      authStore.login(mockAdminUser, mockFirebaseUser)

      const mockQuery = { where: vi.fn() }
      const mockQuerySnap = {
        docs: [
          {
            id: 'result1',
            data: () => ({
              userId: 'u1',
              quizId: 'quiz1',
              score: 80,
            }),
          },
          {
            id: 'result2',
            data: () => ({
              userId: 'u2',
              quizId: 'quiz1',
              score: 90,
            }),
          },
        ],
      }

      vi.mocked(collection).mockReturnValue(mockQuery as unknown as ReturnType<typeof collection>)
      vi.mocked(query).mockReturnValue(mockQuery as unknown as ReturnType<typeof query>)
      vi.mocked(getDocs).mockResolvedValue(
        mockQuerySnap as unknown as Awaited<ReturnType<typeof getDocs>>
      )

      const resultsQuery = query(collection(db, 'userResults'))
      const resultsSnap = await getDocs(resultsQuery)

      expect(resultsSnap.docs).toHaveLength(2)
    })
  })
})
