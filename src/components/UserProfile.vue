<template>
  <div class="max-w-md mx-auto p-8 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl mt-16 border border-gray-200 dark:border-gray-700">
    <h2 class="text-2xl font-extrabold mb-6 text-center text-green-700 dark:text-green-300">Your Profile</h2>
    <div class="mb-4">
      <label class="block font-semibold mb-1 text-gray-700 dark:text-gray-200">Name</label>
      <input v-model="name" type="text" class="input focus:ring-2 focus:ring-green-400" />
    </div>
    <div class="mb-4">
      <label class="block font-semibold mb-1 text-gray-700 dark:text-gray-200">Email</label>
      <input :value="user?.email" type="email" class="input" disabled />
    </div>
    <div class="mb-4">
      <label class="block font-semibold mb-1 text-gray-700 dark:text-gray-200">New Password</label>
      <input v-model="password" type="password" class="input focus:ring-2 focus:ring-green-400" placeholder="Leave blank to keep current" />
    </div>
    <div class="flex gap-2 mt-6 items-center">
      <button class="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition" @click="save">Save</button>
      <span v-if="success" class="text-green-600 text-sm mt-2">Profile updated!</span>
      <span v-if="error" class="text-red-600 text-sm mt-2">{{ error }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { updateProfile, updatePassword } from 'firebase/auth'
import { db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const { user } = useAuth()
const name = ref(user.value?.displayName || '')
const password = ref('')
const error = ref('')
const success = ref(false)

onMounted(async () => {
  if (user.value) {
    try {
      const docRef = doc(db, 'users', user.value.uid)
      const snap = await getDoc(docRef)
      if (snap.exists()) {
        const data = snap.data()
        if (data && data.name) name.value = data.name
      }
    } catch (e: any) {
      error.value = 'Failed to load profile from database.'
    }
  }
})

async function save() {
  error.value = ''
  success.value = false
  try {
    if (user.value && name.value && name.value !== user.value.displayName) {
      await updateProfile(user.value, { displayName: name.value })
      // Save to Firestore
      const docRef = doc(db, 'users', user.value.uid)
      await setDoc(docRef, { name: name.value, email: user.value.email, isAdmin: !!(user.value as any).isAdmin }, { merge: true })
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