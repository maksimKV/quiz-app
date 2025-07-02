import { defineStore } from 'pinia'
import type { User } from '../types/user'
import type { User as FirebaseUser } from 'firebase/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    firebaseUser: null as FirebaseUser | null,
    isAuthenticated: false,
  }),
  actions: {
    login(user: User, firebaseUser: FirebaseUser) {
      this.user = user
      this.firebaseUser = firebaseUser
      this.isAuthenticated = true
    },
    logout() {
      this.user = null
      this.firebaseUser = null
      this.isAuthenticated = false
    },
  },
})
