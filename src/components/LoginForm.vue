<template>
  <div
    class="max-w-md mx-auto p-8 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl mt-16 border border-gray-200 dark:border-gray-700"
  >
    <h2 class="text-2xl font-extrabold mb-6 text-center text-blue-700 dark:text-blue-300">Login</h2>
    <form class="space-y-6" @submit.prevent="onLogin">
      <div>
        <label class="block font-semibold mb-1 text-gray-700 dark:text-gray-200">Email</label>
        <input
          v-model="email"
          type="email"
          class="input focus:ring-2 focus:ring-blue-400"
          required
          autocomplete="username"
        />
      </div>
      <div>
        <label class="block font-semibold mb-1 text-gray-700 dark:text-gray-200">Password</label>
        <input
          v-model="password"
          type="password"
          class="input focus:ring-2 focus:ring-blue-400"
          required
          autocomplete="current-password"
        />
      </div>
      <div v-if="error" class="text-red-600 text-sm mb-2 flex flex-col gap-2">
        <span>{{ error }}</span>
        <button
          v-if="showResend"
          type="button"
          class="underline text-blue-600 hover:text-blue-800"
          :disabled="resending"
          @click="resendEmail"
        >
          <span v-if="!resending">Resend Verification Email</span>
          <span v-else>Sending...</span>
        </button>
        <span v-if="resent" class="text-green-600">Verification email sent!</span>
      </div>
      <button
        type="submit"
        class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="loading"
      >
        Login
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const email = ref('')
const password = ref('')
const resending = ref(false)
const resent = ref(false)
const { login, error, resendVerificationEmail, loading } = useAuth()

const showResend = ref(false)
const router = useRouter()

async function onLogin() {
  resent.value = false
  showResend.value = false
  try {
    await login(email.value, password.value)
    router.push('/profile')
  } catch {
    // If the error is about verification, show the resend button
    if (error.value && error.value.includes('verify your email')) {
      showResend.value = true
    }
  }
}

async function resendEmail() {
  resending.value = true
  resent.value = false
  try {
    await resendVerificationEmail()
    resent.value = true
  } catch {
    // error is already set in useAuth
  } finally {
    resending.value = false
  }
}
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700;
}
</style>
