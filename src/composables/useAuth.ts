import { ref, onUnmounted } from 'vue'
import { auth } from '../firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  sendEmailVerification,
  getIdTokenResult,
} from 'firebase/auth'
import { useAuthStore } from '../store/auth'
import { userService } from '../services/userService'

export function useAuth() {
  const user = ref<User | null>(null)
  const firebaseUser = ref<User | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const authReady = ref(false)

  const authStore = useAuthStore()

  const unsubscribe = onAuthStateChanged(auth, async (firebaseUserObj: User | null) => {
    firebaseUser.value = firebaseUserObj
    loading.value = false
    if (firebaseUserObj) {
      const idTokenResult = await getIdTokenResult(firebaseUserObj)
      const isAdmin = !!idTokenResult.claims.isAdmin
      const extendedUser = Object.assign({}, firebaseUserObj, { isAdmin })
      user.value = extendedUser
      authStore.login(
        {
          id: firebaseUserObj.uid,
          uid: firebaseUserObj.uid,
          name: firebaseUserObj.displayName || firebaseUserObj.email || '',
          email: firebaseUserObj.email || '',
          isAdmin,
        },
        extendedUser
      )
      // Ensure user document exists in Firestore
      const existingUserDoc = await userService.getUserById(firebaseUserObj.uid)
      if (!existingUserDoc) {
        await userService.setUserFields(firebaseUserObj.uid, {
          id: firebaseUserObj.uid,
          uid: firebaseUserObj.uid,
          name: firebaseUserObj.displayName || firebaseUserObj.email || '',
          email: firebaseUserObj.email || '',
          isAdmin,
          xp: 0,
          badges: [],
          streak: { count: 0, lastDate: '', longest: 0 },
        })
      }
    } else {
      user.value = null
      authStore.logout()
    }
    authReady.value = true
  })

  // --- Cross-tab sync and periodic refresh additions ---
  let refreshInterval: ReturnType<typeof setInterval> | null = null

  // Cross-tab sync: listen for login/logout in other tabs
  function handleStorageEvent(e: StorageEvent) {
    if (e.key === 'quiz-app-auth-event') {
      // Force reload user state
      if (auth.currentUser) {
        auth.currentUser.reload().then(() => {
          // This will trigger onAuthStateChanged if user changes
        })
      } else {
        // If logged out in another tab, ensure local logout
        user.value = null
        firebaseUser.value = null
        authStore.logout()
        authReady.value = true
      }
    }
  }
  window.addEventListener('storage', handleStorageEvent)

  // Write to localStorage on login/logout to notify other tabs
  function notifyAuthEvent() {
    localStorage.setItem('quiz-app-auth-event', Date.now().toString())
  }

  // Patch logout to notify other tabs
  async function logout() {
    await signOut(auth)
    notifyAuthEvent()
  }

  // Patch login to notify other tabs
  async function login(email: string, password: string) {
    error.value = null
    loading.value = true
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const idTokenResult = await getIdTokenResult(cred.user)
      const isAdmin = !!idTokenResult.claims.isAdmin
      const extendedUser = Object.assign({}, cred.user, { isAdmin })
      user.value = extendedUser
      authStore.login(
        {
          id: cred.user.uid,
          uid: cred.user.uid,
          name: cred.user.displayName || cred.user.email || '',
          email: cred.user.email || '',
          isAdmin,
        },
        extendedUser
      )
      // Ensure user document exists in Firestore
      const existingUserDoc = await userService.getUserById(cred.user.uid)
      if (!existingUserDoc) {
        await userService.setUserFields(cred.user.uid, {
          id: cred.user.uid,
          uid: cred.user.uid,
          name: cred.user.displayName || cred.user.email || '',
          email: cred.user.email || '',
          isAdmin,
          xp: 0,
          badges: [],
          streak: { count: 0, lastDate: '', longest: 0 },
        })
      }
      notifyAuthEvent()
      return cred.user
    } catch (e: unknown) {
      if (e instanceof Error) {
        error.value = e.message
      } else {
        error.value = String(e)
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  // Periodic user state refresh (every 5 minutes)
  function startPeriodicRefresh() {
    if (refreshInterval) clearInterval(refreshInterval)
    refreshInterval = setInterval(
      async () => {
        if (auth.currentUser) {
          await auth.currentUser.reload()
          // If user changed (e.g., logged out elsewhere), onAuthStateChanged will fire
        }
      },
      5 * 60 * 1000
    ) // 5 minutes
  }
  startPeriodicRefresh()

  // Clean up listeners on unmount
  onUnmounted(() => {
    unsubscribe()
    window.removeEventListener('storage', handleStorageEvent)
    if (refreshInterval) clearInterval(refreshInterval)
  })

  async function signup(email: string, password: string, name?: string) {
    error.value = null
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      if (name) {
        await updateProfile(cred.user, { displayName: name })
      }
      await signInWithEmailAndPassword(auth, email, password)
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser)
      }
      return cred.user
    } catch (e: unknown) {
      if (e instanceof Error) {
        error.value = e.message
      } else {
        error.value = String(e)
      }
      throw e
    }
  }

  async function resendVerificationEmail() {
    error.value = null
    if (!auth.currentUser) {
      error.value = 'No user is currently signed in.'
      throw new Error(error.value)
    }
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser)
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        error.value = e.message
      } else {
        error.value = String(e)
      }
      throw e
    }
  }

  return {
    user,
    firebaseUser,
    loading,
    error,
    signup,
    login,
    logout,
    resendVerificationEmail,
    authReady,
  }
}
