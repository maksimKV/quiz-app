import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import AdminPanel from '../../../views/AdminPanel.vue'
import AdminUserManagementModal from '../../../components/AdminUserManagementModal.vue'

global.fetch = vi.fn()
const mockGetIdToken = vi.fn()

vi.mock('../../../composables/useAuth', () => ({
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
    },
  })
}

async function flushAll() {
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

describe('AdminPanel.vue Integration', () => {
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

  it('invites new users', async () => {
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

  it('promotes and demotes users', async () => {
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

  it('views analytics', async () => {
    const wrapper = mountPanel()
    const btn = wrapper.findAll('button').find(b => b.text().includes('View Analytics'))
    expect(btn).toBeDefined()
    await btn!.trigger('click')
    await nextTick()
    expect(wrapper.html()).toContain('Analytics')
  })

  it('manages quizzes', async () => {
    const wrapper = mountPanel()
    expect(wrapper.findComponent({ name: 'AdminQuizList' }).exists()).toBe(true)
    // Simulate edit, create, delete, preview events if needed
  })
})
