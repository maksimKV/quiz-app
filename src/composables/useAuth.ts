import { ref, onUnmounted } from 'vue'
import { auth } from '../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, User, sendEmailVerification } from 'firebase/auth'
import { useAuthStore } from '../store/auth'

const user = ref<User | null>(null)
const firebaseUser = ref<User | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const authStore = useAuthStore()

const unsubscribe = onAuthStateChanged(auth, (firebaseUserObj) => {
  firebaseUser.value = firebaseUserObj
  user.value = firebaseUserObj
  loading.value = false
  if (firebaseUserObj) {
    authStore.login({
      id: firebaseUserObj.uid,
      name: firebaseUserObj.displayName || firebaseUserObj.email || '',
      email: firebaseUserObj.email || '',
      isAdmin: false // You can extend this with custom claims or Firestore roles
    })
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
    if (!cred.user.emailVerified) {
      await signOut(auth)
      error.value = 'Please verify your email before logging in. You can resend the verification email below.'
      throw new Error(error.value)
    }
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

export function useAuth() {
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