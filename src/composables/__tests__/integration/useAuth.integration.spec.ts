import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from '../../useAuth'
import { setActivePinia, createPinia } from 'pinia'
import * as userService from '../../../services/userService'
import * as auth from 'firebase/auth'

vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual<typeof import('firebase/auth')>('firebase/auth')
  return {
    ...actual,
    createUserWithEmailAndPassword: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
    updateProfile: vi.fn(),
    sendEmailVerification: vi.fn(),
    getIdTokenResult: vi.fn(),
    getAuth: vi.fn(() => ({})),
  }
})

vi.mock('../../../services/userService', () => ({
  userService: {
    getUserById: vi.fn(),
    setUserFields: vi.fn(),
  },
}))

describe('useAuth integration', () => {
  let createUserWithEmailAndPassword: ReturnType<typeof vi.fn>
  let signInWithEmailAndPassword: ReturnType<typeof vi.fn>
  let sendEmailVerification: ReturnType<typeof vi.fn>
  let getUserById: ReturnType<typeof vi.fn>
  let setUserFields: ReturnType<typeof vi.fn>
  let getIdTokenResult: ReturnType<typeof vi.fn>
  let mockUser: auth.User

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    createUserWithEmailAndPassword = auth.createUserWithEmailAndPassword as ReturnType<typeof vi.fn>
    signInWithEmailAndPassword = auth.signInWithEmailAndPassword as ReturnType<typeof vi.fn>
    sendEmailVerification = auth.sendEmailVerification as ReturnType<typeof vi.fn>
    getUserById = userService.userService.getUserById as ReturnType<typeof vi.fn>
    setUserFields = userService.userService.setUserFields as ReturnType<typeof vi.fn>
    getIdTokenResult = auth.getIdTokenResult as ReturnType<typeof vi.fn>
    mockUser = { uid: 'u1', email: 'a@example.com', displayName: 'A' } as auth.User
    // Mock onAuthStateChanged to immediately call the callback with the mock user
    ;(auth.onAuthStateChanged as ReturnType<typeof vi.fn>).mockImplementation(
      (authArg, nextOrObserver) => {
        if (typeof nextOrObserver === 'function') {
          nextOrObserver(mockUser)
        }
        return () => {}
      }
    )
    // Mock getIdTokenResult to return claims
    getIdTokenResult.mockResolvedValue({ claims: {} })
  })

  it('creates user document on signup if not exists', async () => {
    const authComposable = useAuth()
    const userCredential: auth.UserCredential = {
      user: mockUser,
      providerId: null,
      operationType: 'signIn',
    }
    createUserWithEmailAndPassword.mockResolvedValue(userCredential)
    signInWithEmailAndPassword.mockResolvedValue(userCredential)
    sendEmailVerification.mockResolvedValue(undefined)
    getUserById.mockImplementation(() => Promise.resolve(null))
    setUserFields.mockResolvedValue(undefined)
    await authComposable.signup('a@example.com', 'pw', 'A')
    expect(setUserFields).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ email: 'a@example.com', name: 'A' })
    )
  })

  it('syncs auth state across tabs (cross-tab sync)', async () => {
    const authComposable = useAuth()
    window.dispatchEvent(new StorageEvent('storage', { key: 'quiz-app-auth-event' }))
    expect(authComposable.user.value).toBeDefined()
  })
})
