<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
    <div
      class="bg-white/95 dark:bg-gray-800/95 p-8 rounded-2xl shadow-2xl max-w-xl w-full relative overflow-auto border border-gray-200 dark:border-gray-700"
    >
      <button
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full transition"
        @click="$emit('close')"
      >
        &times;
      </button>
      <h2 class="text-2xl font-extrabold mb-6 text-pink-700 dark:text-pink-300 text-center">
        User Management
      </h2>
      <form
        v-if="isAdmin"
        class="mb-6 flex flex-wrap gap-3 items-end justify-center"
        @submit.prevent="$emit('invite')"
      >
        <input
          :value="inviteName"
          type="text"
          placeholder="Name"
          class="input w-32"
          @input="$emit('update:inviteName', ($event.target as HTMLInputElement).value)"
        />
        <input
          :value="inviteEmail"
          type="email"
          placeholder="Email"
          class="input w-48"
          required
          @input="$emit('update:inviteEmail', ($event.target as HTMLInputElement).value)"
        />
        <button
          type="submit"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        >
          Invite User
        </button>
        <span v-if="inviteError" class="text-red-600 text-xs ml-2">{{ inviteError }}</span>
        <span v-if="inviteLink" class="text-green-600 text-xs ml-2"
          >Invite Link: <a :href="inviteLink" target="_blank" class="underline">Open</a></span
        >
      </form>
      <div v-if="loading" class="text-gray-500 mb-2">Loading users...</div>
      <div v-if="error" class="text-red-600 mb-2">{{ error }}</div>
      <table
        v-if="!loading"
        class="w-full text-sm mb-4 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
      >
        <thead class="bg-gray-100 dark:bg-gray-900">
          <tr>
            <th class="text-left px-4 py-2">Name</th>
            <th class="text-left px-4 py-2">Email</th>
            <th class="text-left px-4 py-2">Role</th>
            <th class="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.uid" class="border-t border-gray-200 dark:border-gray-700">
            <td class="px-4 py-2">{{ u.displayName || u.email }}</td>
            <td class="px-4 py-2">{{ u.email }}</td>
            <td class="px-4 py-2">
              <span v-if="u.isAdmin" class="text-green-700 font-semibold">Admin</span>
              <span v-else class="text-gray-700">User</span>
            </td>
            <td class="flex gap-2 px-4 py-2">
              <button
                v-if="!u.isAdmin"
                class="px-2 py-1 bg-green-600 text-white rounded shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                @click="$emit('promote', u)"
              >
                Promote
              </button>
              <button
                v-if="u.isAdmin"
                class="px-2 py-1 bg-yellow-600 text-white rounded shadow hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                @click="$emit('demote', u)"
              >
                Demote
              </button>
              <button
                class="px-2 py-1 bg-red-600 text-white rounded shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
                @click="$emit('delete', u)"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdminUser } from '../types/user'

defineProps<{
  users: AdminUser[]
  isAdmin: boolean
  loading: boolean
  error: string
  inviteName: string
  inviteEmail: string
  inviteError: string
  inviteLink: string
}>()

defineEmits<{
  close: []
  invite: []
  'update:inviteName': [value: string]
  'update:inviteEmail': [value: string]
  promote: [user: AdminUser]
  demote: [user: AdminUser]
  delete: [user: AdminUser]
}>()
</script>
