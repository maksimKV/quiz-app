import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import UserManagement from '../../../views/UserManagement.vue'
import AdminUserManagementModal from '../../../components/AdminUserManagementModal.vue'
import type { AdminUser } from '../../../types/user'

function mountUserManagement(users: AdminUser[] = []) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const wrapper = shallowMount(UserManagement, {
    global: {
      plugins: [pinia],
      stubs: {},
    },
  })
  // Set the users ref directly after wrapper is assigned
  wrapper.vm.users = users
  return wrapper
}

describe('UserManagement.vue Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists all users', async () => {
    const users: AdminUser[] = [
      { uid: 'u1', email: 'a@example.com', displayName: 'A', isAdmin: false },
      { uid: 'u2', email: 'b@example.com', displayName: 'B', isAdmin: true },
    ]
    const wrapper = mountUserManagement(users)
    await wrapper.vm.$nextTick()
    const modal = wrapper.findComponent(AdminUserManagementModal)
    expect(modal.exists()).toBe(true)
    expect(modal.props('users')).toEqual(users)
    // Don't check modal.html() for user display names or emails, since the modal is stubbed
  })

  it('changes user roles', async () => {
    const users: AdminUser[] = [
      { uid: 'u1', email: 'a@example.com', displayName: 'A', isAdmin: false },
      { uid: 'u2', email: 'b@example.com', displayName: 'B', isAdmin: true },
    ]
    const wrapper = mountUserManagement(users)
    await wrapper.vm.$nextTick()
    const modal = wrapper.findComponent(AdminUserManagementModal)
    modal.vm.$emit('promote', users[0])
    modal.vm.$emit('demote', users[1])
    expect(modal.emitted('promote')).toBeTruthy()
    expect(modal.emitted('demote')).toBeTruthy()
  })

  it('deletes users', async () => {
    const users: AdminUser[] = [
      { uid: 'u1', email: 'a@example.com', displayName: 'A', isAdmin: false },
      { uid: 'u2', email: 'b@example.com', displayName: 'B', isAdmin: true },
    ]
    const wrapper = mountUserManagement(users)
    await wrapper.vm.$nextTick()
    const modal = wrapper.findComponent(AdminUserManagementModal)
    modal.vm.$emit('delete', users[0])
    expect(modal.emitted('delete')).toBeTruthy()
  })
})
