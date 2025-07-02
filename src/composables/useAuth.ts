import { ref, onUnmounted } from 'vue'
import { auth } from '../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, User, sendEmailVerification, getIdTokenResult } from 'firebase/auth'
import { useAuthStore } from '../store/auth'

export function useAuth() {
  const user = ref<User | null>(null)
  const firebaseUser = ref<User | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const authStore = useAuthStore()

  const unsubscribe = onAuthStateChanged(auth, async (firebaseUserObj: User | null) => {
    firebaseUser.value = firebaseUserObj
    user.value = firebaseUserObj
    loading.value = false
    if (firebaseUserObj) {
      const idTokenResult = await getIdTokenResult(firebaseUserObj)
      const isAdmin = !!idTokenResult.claims.isAdmin
      authStore.login({
        id: firebaseUserObj.uid,
        uid: firebaseUserObj.uid,
        name: firebaseUserObj.displayName || firebaseUserObj.email || '',
        email: firebaseUserObj.email || '',
        isAdmin
      }, firebaseUserObj)
      user.value = { ...firebaseUserObj, isAdmin } as User & { isAdmin: boolean }
    } else {
      authStore.logout()
    }
  })

  onUnmounted(() => unsubscribe())

  async function signup(email: string, password: string, name?: string) {
    error.value = null
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      if (name) {
        await updateProfile(cred.user, { displayName: name })
      }
      await signInWithEmailAndPassword(auth, email, password)
      await sendEmailVerification(auth.currentUser)
      return cred.user
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  async function login(email: string, password: string) {
    error.value = null
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const idTokenResult = await getIdTokenResult(cred.user)
      const isAdmin = !!idTokenResult.claims.isAdmin
      authStore.login({
        id: cred.user.uid,
        uid: cred.user.uid,
        name: cred.user.displayName || cred.user.email || '',
        email: cred.user.email || '',
        isAdmin
      }, cred.user)
      user.value = { ...cred.user, isAdmin } as User & { isAdmin: boolean }
      return cred.user
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  async function logout() {
    await signOut(auth)
  }

  async function resendVerificationEmail() {
    error.value = null
    if (!auth.currentUser) {
      error.value = 'No user is currently signed in.'
      throw new Error(error.value)
    }
    try {
      await sendEmailVerification(auth.currentUser)
    } catch (e: any) {
      error.value = e.message
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
    resendVerificationEmail
  }
} 