import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Verified from '../../../views/Verified.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn(), currentRoute: { value: { fullPath: '/verified' } } }),
}))
vi.mock('../../../firebase', () => ({
  auth: {
    currentUser: { reload: vi.fn(), emailVerified: true },
  },
}))
vi.mock('firebase/auth', () => ({
  isSignInWithEmailLink: () => false,
  signInWithEmailLink: vi.fn(),
}))

describe('Verified.vue Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles email verification and redirects appropriately', async () => {
    const wrapper = mount(Verified)
    await flushPromises()
    expect(wrapper.text()).toContain('Email Verification')
    // Simulate verified state
    await flushPromises()
    expect(wrapper.text()).toMatch(/Redirecting/)
  })
})
