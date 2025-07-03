<template>
  <div
    class="p-8 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl mt-16 border border-gray-200 dark:border-gray-700"
  >
    <h2 class="text-2xl font-extrabold mb-6 text-center text-blue-700 dark:text-blue-300">
      Register
    </h2>
    <form class="space-y-6" @submit.prevent="onRegister">
      <div>
        <label class="block font-semibold mb-1 text-gray-700 dark:text-gray-200">Name</label>
        <input v-model="name" type="text" class="input focus:ring-2 focus:ring-blue-400" required />
      </div>
      <div>
        <label class="block font-semibold mb-1 text-gray-700 dark:text-gray-200">Email</label>
        <input
          v-model="email"
          type="email"
          class="input focus:ring-2 focus:ring-blue-400"
          required
        />
      </div>
      <div>
        <label class="block font-semibold mb-1 text-gray-700 dark:text-gray-200">Password</label>
        <input
          v-model="password"
          type="password"
          class="input focus:ring-2 focus:ring-blue-400"
          required
        />
      </div>
      <div class="flex items-center gap-2">
        <input id="admin" v-model="isAdmin" type="checkbox" class="accent-blue-600" />
        <label for="admin" class="font-semibold text-gray-700 dark:text-gray-200"
          >Register as Admin</label
        >
      </div>
      <div v-if="error" class="text-red-600 text-sm mb-2">{{ error }}</div>
      <div v-if="success" class="text-green-600 text-sm mb-2">
        Registration successful! Please check your email to verify your account.
      </div>
      <button
        type="submit"
        class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="loading"
      >
        Register
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const name = ref('')
const email = ref('')
const password = ref('')
const isAdmin = ref(false)
const error = ref('')
const success = ref(false)
const loading = ref(false)

const router = useRouter()
const { login } = useAuth()

async function onRegister() {
  error.value = ''
  success.value = false
  loading.value = true
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        password: password.value,
        isAdmin: isAdmin.value,
      }),
    })
    if (!res.ok) throw new Error(await res.text())
    // Try to log the user in immediately after registration
    try {
      await login(email.value, password.value)
      router.push('/verify-email')
    } catch (loginErr: unknown) {
      error.value =
        'Registered, but failed to log in: ' + ((loginErr as Error).message || String(loginErr))
      return
    }
    success.value = true
    name.value = ''
    email.value = ''
    password.value = ''
    isAdmin.value = false
  } catch (e: unknown) {
    error.value = (e as Error).message || 'Registration failed.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700;
}
</style>
