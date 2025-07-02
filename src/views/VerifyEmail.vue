<template>
  <div class="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded shadow mt-12">
    <h2 class="text-xl font-bold mb-4">Verify Your Email</h2>
    <p class="mb-4">A verification link has been sent to your email. Please check your inbox and click the link to verify your account.</p>
    <button @click="refreshVerification" :disabled="refreshing" class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-2">
      {{ refreshing ? 'Checking...' : 'I have verified my email' }}
    </button>
    <div v-if="message" class="mt-2 text-center" :class="{'text-green-600': message.includes('verified'), 'text-red-600': message.includes('not verified')}">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { getAuth, reload } from 'firebase/auth'

const router = useRouter()
const { user } = useAuth()
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
        message.value = 'Email not verified yet. Please check your inbox and click the verification link.'
      }
    } else {
      message.value = 'You are not logged in.'
    }
  } catch (e) {
    message.value = 'Error refreshing status.'
  } finally {
    refreshing.value = false
  }
}
</script> 