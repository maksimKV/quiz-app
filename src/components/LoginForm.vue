<template>
  <div class="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded shadow mt-12">
    <h2 class="text-xl font-bold mb-4">Login</h2>
    <form @submit.prevent="onLogin" class="space-y-4">
      <div>
        <label class="block font-semibold mb-1">Email</label>
        <input v-model="email" type="email" class="input" required autocomplete="username" />
      </div>
      <div>
        <label class="block font-semibold mb-1">Password</label>
        <input v-model="password" type="password" class="input" required autocomplete="current-password" />
      </div>
      <div v-if="error" class="text-red-600 text-sm mb-2 flex flex-col gap-2">
        <span>{{ error }}</span>
        <button v-if="showResend" type="button" class="underline text-blue-600 hover:text-blue-800" @click="resendEmail" :disabled="resending">
          <span v-if="!resending">Resend Verification Email</span>
          <span v-else>Sending...</span>
        </button>
        <span v-if="resent" class="text-green-600">Verification email sent!</span>
      </div>
      <button type="submit" class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" :disabled="loading">Login</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

const email = ref('')
const password = ref('')
const resending = ref(false)
const resent = ref(false)
const { login, error, resendVerificationEmail, loading } = useAuth()

const showResend = ref(false)

async function onLogin() {
  resent.value = false
  showResend.value = false
  try {
    await login(email.value, password.value)
  } catch (e: any) {
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
  } catch (e) {
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