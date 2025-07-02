import { defineStore } from 'pinia'
import type { User } from '../types/user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isAuthenticated: false,
  }),
  actions: {
    login(user: User) {
      this.user = user
      this.isAuthenticated = true
    },
    logout() {
      this.user = null
      this.isAuthenticated = false
    },
  },
}) 