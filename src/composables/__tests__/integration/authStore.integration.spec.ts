import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../../../store/auth'
import type { User } from '../../../types/user'
import type { User as FirebaseUser } from 'firebase/auth'

const mockUser: User = {
  id: 'u1',
  uid: 'u1',
  name: 'Test User',
  email: 'test@example.com',
  isAdmin: false,
}
const mockFirebaseUser: FirebaseUser = {
  uid: 'u1',
  email: 'test@example.com',
  // Provide required properties for FirebaseUser type
  displayName: null,
  emailVerified: false,
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
} as FirebaseUser

describe('auth store integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('logs in and sets user state', () => {
    const store = useAuthStore()
    store.login(mockUser, mockFirebaseUser)
    expect(store.user).toEqual(mockUser)
    expect(store.firebaseUser).toEqual(mockFirebaseUser)
    expect(store.isAuthenticated).toBe(true)
  })

  it('logs out and clears user state', () => {
    const store = useAuthStore()
    store.login(mockUser, mockFirebaseUser)
    store.logout()
    expect(store.user).toBeNull()
    expect(store.firebaseUser).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })
})
