import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import VerifyEmail from '../../../views/VerifyEmail.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('firebase/auth', () => ({
  getAuth: () => ({ currentUser: { emailVerified: true, reload: vi.fn() } }),
  reload: vi.fn(),
}))

describe('VerifyEmail.vue Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles email verification and redirects appropriately', async () => {
    const wrapper = mount(VerifyEmail)
    await flushPromises()
    expect(wrapper.text()).toContain('Verify Your Email')
    // Simulate clicking the refresh button
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toMatch(/Email verified!|Redirecting/)
  })
})
