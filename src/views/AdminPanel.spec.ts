import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import AdminPanel from './AdminPanel.vue'
import AdminUserManagementModal from '../components/AdminUserManagementModal.vue'

// Mock fetch and token logic
global.fetch = vi.fn()
const mockGetIdToken = vi.fn()

vi.mock('../composables/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: { value: { getIdToken: mockGetIdToken } },
    authReady: { value: true },
  }),
}))

function mountPanel() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return shallowMount(AdminPanel, {
    global: {
      plugins: [pinia],
      stubs: {
        AdminQuizList: true,
        AdminQuizForm: true,
        AdminAnalyticsModal: true,
        QuizPlayerView: true,
      },
      // DO NOT stub AdminUserManagementModal
    },
  })
}

async function flushAll() {
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

describe('Admin Features', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetIdToken.mockResolvedValue('mock-token')
  })

  async function openUserManagementModal(wrapper: ReturnType<typeof mountPanel>) {
    const btn = wrapper.findAll('button').find(b => b.text().includes('User Management'))
    expect(btn).toBeDefined()
    await btn!.trigger('click')
    await nextTick()
    const modal = wrapper.findComponent(AdminUserManagementModal)
    expect(modal.exists()).toBe(true)
    return modal
  }

  it('Should promote/demote users and update admin status.', async () => {
    const wrapper = mountPanel()
    const modal = await openUserManagementModal(wrapper)
    ;(fetch as unknown as Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    await modal.vm.$emit('promote', { uid: 'user1' })
    await flushAll()
    expect(fetch).toHaveBeenCalledWith(
      '/api/users/promote',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer mock-token' }),
        body: JSON.stringify({ uid: 'user1' }),
      })
    )
    ;(fetch as unknown as Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    await modal.vm.$emit('demote', { uid: 'user1' })
    await flushAll()
    expect(fetch).toHaveBeenCalledWith(
      '/api/users/demote',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer mock-token' }),
        body: JSON.stringify({ uid: 'user1' }),
      })
    )
  })

  it('Should invite users and send email.', async () => {
    const wrapper = mountPanel()
    const modal = await openUserManagementModal(wrapper)
    await modal.vm.$emit('update:inviteEmail', 'test@example.com')
    await modal.vm.$emit('update:inviteName', 'Test User')
    ;(fetch as unknown as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ inviteLink: 'http://invite.link' }),
    })
    await modal.vm.$emit('invite')
    await flushAll()
    const updatedModal = wrapper.findComponent(AdminUserManagementModal)
    expect(updatedModal.props('inviteLink')).toBe('http://invite.link')
    expect(updatedModal.html()).toContain('http://invite.link')
  })

  it('Should handle errors in user management actions.', async () => {
    const wrapper = mountPanel()
    const modal = await openUserManagementModal(wrapper)
    ;(fetch as unknown as Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => 'Promote error',
    })
    await modal.vm.$emit('promote', { uid: 'user1' })
    await flushAll()
    let updatedModal = wrapper.findComponent(AdminUserManagementModal)
    expect(updatedModal.props('error')).toBe('Promote error')
    expect(updatedModal.html()).toContain('Promote error')
    await modal.vm.$emit('update:inviteEmail', 'fail@example.com')
    await modal.vm.$emit('update:inviteName', 'Fail User')
    ;(fetch as unknown as Mock).mockResolvedValueOnce({
      ok: false,
      text: async () => 'Invite error',
    })
    await modal.vm.$emit('invite')
    await flushAll()
    updatedModal = wrapper.findComponent(AdminUserManagementModal)
    expect(updatedModal.props('inviteError')).toBe('Invite error')
    expect(updatedModal.html()).toContain('Invite error')
  })
})
