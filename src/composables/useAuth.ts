import { ref, onUnmounted } from 'vue'
import { auth } from '../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, User } from 'firebase/auth'
import { useAuthStore } from '../store/auth'

const user = ref<User | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const authStore = useAuthStore()

const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
  user.value = firebaseUser
  loading.value = false
  if (firebaseUser) {
    authStore.login({
      id: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email || '',
      email: firebaseUser.email || '',
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
    return cred.user
  } catch (e: any) {
    error.value = e.message
    throw e
  }
}

async function logout() {
  await signOut(auth)
}

export function useAuth() {
  return {
    user,
    loading,
    error,
    signup,
    login,
    logout
  }
} 