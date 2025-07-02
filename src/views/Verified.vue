<template>
  <div
    class="max-w-md mx-auto p-8 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl mt-16 text-center border border-gray-200 dark:border-gray-700"
  >
    <h2 class="text-2xl font-extrabold mb-6 text-green-700 dark:text-green-300">
      Email Verification
    </h2>
    <p v-if="success" class="mb-6 text-green-700 dark:text-green-300 font-semibold">
      You are now signed in! Redirecting...
    </p>
    <p v-else-if="verified" class="mb-6 text-green-700 dark:text-green-300 font-semibold">
      Your email is now verified! Redirecting...
    </p>
    <p v-else-if="error" class="mb-6 text-red-600 dark:text-red-400 font-semibold">{{ error }}</p>
    <p v-else class="mb-6 text-gray-700 dark:text-gray-200">Verifying your email link...</p>
    <router-link
      v-if="!success && !verified"
      to="/login"
      class="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
      >Go to Login</router-link
    >
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../firebase'
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'

const success = ref(false)
const verified = ref(false)
const error = ref('')
const router = useRouter()

onMounted(async () => {
  // Magic link sign-in logic
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem('emailForSignIn') || ''
    if (!email) {
      email = window.prompt('Please provide your email for confirmation') || ''
    }
    try {
      await signInWithEmailLink(auth, email, window.location.href)
      window.localStorage.removeItem('emailForSignIn')
      success.value = true
      setTimeout(() => router.push('/profile'), 2000)
      return
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Failed to sign in with email link.'
      return
    }
  }

  // Email verification logic (after Firebase redirects here)
  if (auth.currentUser) {
    try {
      await auth.currentUser.reload()
      if (auth.currentUser.emailVerified) {
        verified.value = true
        setTimeout(() => router.push('/dashboard'), 2000)
      } else {
        error.value = 'Email verification failed. Please try again.'
      }
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Failed to verify email.'
    }
  } else {
    error.value = 'Please log in to complete email verification.'
  }
})
</script>
