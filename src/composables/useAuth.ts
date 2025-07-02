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
      console.log('onAuthStateChanged user:', extendedUser)
    } else {
      user.value = null
      authStore.logout()
    }
    authReady.value = true
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
      console.log('login user:', extendedUser)
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
