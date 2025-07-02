<template>
  <div class="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded shadow mt-12">
    <h2 class="text-xl font-bold mb-4">Register</h2>
    <form @submit.prevent="onRegister" class="space-y-4">
      <div>
        <label class="block font-semibold mb-1">Name</label>
        <input v-model="name" type="text" class="input" required />
      </div>
      <div>
        <label class="block font-semibold mb-1">Email</label>
        <input v-model="email" type="email" class="input" required />
      </div>
      <div>
        <label class="block font-semibold mb-1">Password</label>
        <input v-model="password" type="password" class="input" required />
      </div>
      <div class="flex items-center gap-2">
        <input v-model="isAdmin" type="checkbox" id="admin" />
        <label for="admin" class="font-semibold">Register as Admin</label>
      </div>
      <div v-if="error" class="text-red-600 text-sm mb-2">{{ error }}</div>
      <div v-if="success" class="text-green-600 text-sm mb-2">Registration successful! Please check your email to verify your account.</div>
      <button type="submit" class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" :disabled="loading">Register</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const name = ref('')
const email = ref('')
const password = ref('')
const isAdmin = ref(false)
const error = ref('')
const success = ref(false)
const loading = ref(false)

async function onRegister() {
  error.value = ''
  success.value = false
  loading.value = true
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.value, email: email.value, password: password.value, isAdmin: isAdmin.value })
    })
    if (!res.ok) throw new Error(await res.text())
    success.value = true
    name.value = ''
    email.value = ''
    password.value = ''
    isAdmin.value = false
  } catch (e: any) {
    error.value = e.message || 'Registration failed.'
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