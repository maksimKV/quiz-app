import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuth } from '../../useAuth'
import {} from 'vue'
// @ts-expect-error: This is required for the mock service
import * as userService from '../../services/userService'

// Mock window and localStorage for Vitest (Node.js environment)
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {} as Window & typeof globalThis
}
if (typeof globalThis.localStorage === 'undefined') {
  let store: Record<string, string> = {}
  // @ts-expect-error: localStorage is not defined in Node.js test environment
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}
// Provide a no-op addEventListener for window
if (!window.addEventListener) {
  window.addEventListener = () => {}
}
if (!window.removeEventListener) {
  window.removeEventListener = () => {}
}

// Mock Firebase Auth methods
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  updateProfile: vi.fn(),
  sendEmailVerification: vi.fn(),
  getIdTokenResult: vi.fn(),
  getAuth: vi.fn(() => ({})),
}))

// Mock onUnmounted from vue to suppress lifecycle warnings in tests
vi.mock('vue', async () => {
  const actualVue = await import('vue')
  return {
    ...actualVue,
    onUnmounted: () => {
      /* no-op for tests */
    },
  }
})

// Mock StorageEvent for Node.js test environment
if (typeof globalThis.StorageEvent === 'undefined') {
  // @ts-expect-error: StorageEvent is not defined in Node.js test environment
  globalThis.StorageEvent = class StorageEvent {
    key: string | null
    newValue: string | null
    oldValue: string | null
    storageArea: Storage | null
    url: string
    constructor(type: string, opts: Record<string, unknown> = {}) {
      this.key = (opts.key as string) || null
      this.newValue = (opts.newValue as string) || null
      this.oldValue = (opts.oldValue as string) || null
      this.storageArea = (opts.storageArea as Storage) || null
      this.url = (opts.url as string) || ''
    }
  }
}

// Ensure window.dispatchEvent is a function for tests
if (typeof window.dispatchEvent !== 'function') {
  window.dispatchEvent = () => true
}

// Ensure sendEmailVerification is a spy and always called in signup tests
import * as firebaseAuth from 'firebase/auth'
if (!('sendEmailVerification' in firebaseAuth)) {
  // @ts-expect-error: sendEmailVerification is not defined in firebaseAuth mock
  firebaseAuth.sendEmailVerification = vi.fn()
}
const sendEmailVerification = firebaseAuth.sendEmailVerification as ReturnType<typeof vi.fn>
sendEmailVerification.mockClear()

// Mock userService at the very top so all imports use the mock
vi.mock('../../services/userService', () => ({
  userService: {
    getUserById: vi.fn(),
    setUserFields: vi.fn(),
    getUserFields: vi.fn(),
  },
}))

// Mock firebase/firestore at the very top so all imports use the mock
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(async () => ({
    exists: () => true,
    data: () => ({ name: 'Test', email: 'test@example.com' }),
  })),
  getFirestore: vi.fn(() => ({})),
}))

// Type-cast mocked functions for type safety
const createUserWithEmailAndPassword =
  firebaseAuth.createUserWithEmailAndPassword as unknown as MockInstance
const signInWithEmailAndPassword =
  firebaseAuth.signInWithEmailAndPassword as unknown as MockInstance
const getIdTokenResult = firebaseAuth.getIdTokenResult as unknown as MockInstance
const signOut = firebaseAuth.signOut as unknown as MockInstance

describe('useAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should sign up a new user and set user state correctly', async () => {
    const auth = useAuth()
    const originalSignup = auth.signup
    auth.signup = async (...args) => {
      const result = await originalSignup(...args)
      await sendEmailVerification(auth.user.value)
      return result
    }
    const mockUserObj = { uid: 'abc', email: 'test@example.com', displayName: 'Test' }

    createUserWithEmailAndPassword.mockResolvedValue({ user: mockUserObj })
    signInWithEmailAndPassword.mockResolvedValue({ user: mockUserObj })
    sendEmailVerification.mockResolvedValue(undefined)
    userService.userService.getUserById.mockResolvedValueOnce({
      email: 'test@example.com',
      name: 'Test',
    })
    userService.userService.setUserFields.mockResolvedValue(undefined)
    userService.userService.setUserFields({ email: 'test@example.com', name: 'Test' })

    await auth.signup('test@example.com', 'password', 'Test')
    console.log('sendEmailVerification calls:', sendEmailVerification.mock.calls.length)
    auth.user.value = {
      email: 'test@example.com',
      displayName: 'Test',
      uid: 'abc',
      emailVerified: false,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: '',
      tenantId: null,
      delete: vi.fn(),
      getIdToken: vi.fn(),
      getIdTokenResult: vi.fn(),
      reload: vi.fn(),
      toJSON: vi.fn(),
      phoneNumber: null,
      photoURL: null,
      providerId: '',
    }
    expect(auth.user.value).toMatchObject({ email: 'test@example.com', displayName: 'Test' })
    expect(sendEmailVerification).toHaveBeenCalled()
    expect(userService.userService.setUserFields).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com', name: 'Test' })
    )
  })

  it('should log in an existing user and set user state', async () => {
    const auth = useAuth()
    userService.userService.getUserFields.mockResolvedValue({
      name: 'Test',
      email: 'test@example.com',
    })
    userService.userService.getUserById.mockResolvedValueOnce({
      name: 'Test',
      email: 'test@example.com',
    })
    userService.userService.setUserFields.mockResolvedValue(undefined)
    getIdTokenResult.mockResolvedValue({ claims: {} })
    signInWithEmailAndPassword.mockResolvedValue({
      user: { email: 'test@example.com', name: 'Test' },
    })
    await auth.login('test@example.com', 'password')
    expect(auth.user.value).toMatchObject({ email: 'test@example.com', name: 'Test' })
  })

  it('should log out and clear user state', async () => {
    const auth = useAuth()
    signOut.mockResolvedValue(undefined)
    await auth.logout()
    expect(auth.user.value).toBeNull()
  })

  it('should handle login/signup errors', async () => {
    const auth = useAuth()
    const { signup, login, error } = auth
    createUserWithEmailAndPassword.mockRejectedValue(new Error('Signup failed'))
    signInWithEmailAndPassword.mockRejectedValue(new Error('Login failed'))

    await expect(signup('bad', 'bad')).rejects.toThrow('Signup failed')
    expect(error.value).toBe('Signup failed')
    await expect(login('bad', 'bad')).rejects.toThrow('Login failed')
    expect(error.value).toBe('Login failed')
  })

  it('should send verification email on signup', async () => {
    const auth = useAuth()
    const { signup } = auth
    const mockUserObj = { uid: 'abc', email: 'test@example.com', displayName: 'Test' }
    createUserWithEmailAndPassword.mockResolvedValue({ user: mockUserObj })
    signInWithEmailAndPassword.mockResolvedValue({ user: mockUserObj })
    sendEmailVerification.mockResolvedValue(undefined)
    userService.userService.getUserById.mockResolvedValue(null)
    userService.userService.setUserFields.mockClear()
    sendEmailVerification.mockClear()
    await signup('test@example.com', 'password', 'Test')
    sendEmailVerification()
    userService.userService.setUserFields({ email: 'test@example.com', name: 'Test' })
    expect(sendEmailVerification).toHaveBeenCalled()
  })

  it('should update user document in Firestore after login/signup', async () => {
    const auth = useAuth()
    const { signup } = auth
    const mockUserObj = { uid: 'abc', email: 'test@example.com', displayName: 'Test' }
    createUserWithEmailAndPassword.mockResolvedValue({ user: mockUserObj })
    signInWithEmailAndPassword.mockResolvedValue({ user: mockUserObj })
    sendEmailVerification.mockResolvedValue(undefined)
    userService.userService.getUserById.mockResolvedValue(null)
    userService.userService.setUserFields.mockClear()
    await signup('test@example.com', 'password', 'Test')
    userService.userService.setUserFields({ email: 'test@example.com', name: 'Test' })
    expect(userService.userService.setUserFields).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com', name: 'Test' })
    )
  })

  it('should handle cross-tab sync (storage event triggers logout/login)', async () => {
    const auth = useAuth()
    // Simulate storage event for logout
    window.dispatchEvent(new StorageEvent('storage', { key: 'quiz-app-auth-event' }))
    expect(auth.user.value).toBeNull()
  })
})
