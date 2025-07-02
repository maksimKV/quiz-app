<template>
  <div
    class="max-w-md mx-auto p-8 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl mt-16 text-center border border-gray-200 dark:border-gray-700"
  >
    <h2 class="text-2xl font-extrabold mb-6 text-blue-700 dark:text-blue-300">Verify Your Email</h2>
    <p class="mb-6 text-gray-700 dark:text-gray-200">
      A verification link has been sent to your email. Please check your inbox and click the link to
      verify your account.
    </p>
    <button
      :disabled="refreshing"
      class="w-full px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
      @click="refreshVerification"
    >
      {{ refreshing ? 'Checking...' : 'I have verified my email' }}
    </button>
    <div
      v-if="message"
      class="mt-2 text-center font-semibold"
      :class="{
        'text-green-600': message.includes('verified'),
        'text-red-600': message.includes('not verified'),
      }"
    >
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, reload } from 'firebase/auth'

const router = useRouter()
const refreshing = ref(false)
const message = ref('')

async function refreshVerification() {
  refreshing.value = true
  message.value = ''
  try {
    const auth = getAuth()
    if (auth.currentUser) {
      await reload(auth.currentUser)
      if (auth.currentUser.emailVerified) {
        message.value = 'Email verified! Redirecting...'
        setTimeout(() => router.push('/profile'), 1000)
      } else {
        message.value =
          'Email not verified yet. Please check your inbox and click the verification link.'
      }
    } else {
      message.value = 'You are not logged in.'
    }
  } catch {
    message.value = 'Error refreshing status.'
  } finally {
    refreshing.value = false
  }
}
</script>
