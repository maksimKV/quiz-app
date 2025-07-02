<template>
  <div
    class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl mt-12 border border-gray-200 dark:border-gray-700"
  >
    <h1 class="text-3xl font-extrabold mb-8 text-center text-pink-700 dark:text-pink-300">
      User Management
    </h1>
    <AdminUserManagementModal
      :users="users"
      :is-admin="isAdmin"
      :loading="loading"
      :error="error"
      :invite-name="inviteName"
      :invite-email="inviteEmail"
      :invite-error="inviteError"
      :invite-link="inviteLink"
      @close="showModal = false"
      @invite="inviteUser"
      @promote="promote"
      @demote="demote"
      @delete="deleteUser"
      @update:invite-name="inviteName = $event"
      @update:invite-email="inviteEmail = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import AdminUserManagementModal from '../components/AdminUserManagementModal.vue'
import { useAuthStore } from '../store/auth'
import type { AdminUser } from '../types/user'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const users = ref<AdminUser[]>([])
const loading = ref(false)
const error = ref('')
const inviteName = ref('')
const inviteEmail = ref('')
const inviteError = ref('')
const inviteLink = ref('')
const showModal = ref(true)

const isAdmin = computed(() => !!(user.value && user.value.isAdmin))

async function inviteUser() {
  // Implementation for inviting user
}

async function promote() {
  // Implementation for promoting user
}

async function demote() {
  // Implementation for demoting user
}

async function deleteUser() {
  // Implementation for deleting user
}

defineExpose({
  users,
  isAdmin,
  loading,
  error,
  inviteName,
  inviteEmail,
  inviteError,
  inviteLink,
  inviteUser,
  promote,
  demote,
  deleteUser,
})
</script>
