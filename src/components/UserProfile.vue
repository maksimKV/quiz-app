<template>
  <div class="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded shadow">
    <h2 class="text-xl font-bold mb-4">Your Profile</h2>
    <div class="mb-4">
      <label class="block font-semibold mb-1">Name</label>
      <input v-model="name" type="text" class="input" />
    </div>
    <div class="mb-4">
      <label class="block font-semibold mb-1">Email</label>
      <input :value="user?.email" type="email" class="input" disabled />
    </div>
    <div class="mb-4">
      <label class="block font-semibold mb-1">New Password</label>
      <input v-model="password" type="password" class="input" placeholder="Leave blank to keep current" />
    </div>
    <div class="flex gap-2 mt-6">
      <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" @click="save">Save</button>
      <span v-if="success" class="text-green-600 text-sm mt-2">Profile updated!</span>
      <span v-if="error" class="text-red-600 text-sm mt-2">{{ error }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import { updateProfile, updatePassword } from 'firebase/auth'

const { user } = useAuth()
const name = ref(user.value?.displayName || '')
const password = ref('')
const error = ref('')
const success = ref(false)

async function save() {
  error.value = ''
  success.value = false
  try {
    if (user.value && name.value && name.value !== user.value.displayName) {
      await updateProfile(user.value, { displayName: name.value })
    }
    if (user.value && password.value) {
      await updatePassword(user.value, password.value)
    }
    success.value = true
    password.value = ''
  } catch (e: any) {
    error.value = e.message || 'Failed to update profile.'
  }
}
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700;
}
</style> 