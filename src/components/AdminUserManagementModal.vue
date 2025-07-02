<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
    <div class="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-xl w-full relative overflow-auto">
      <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" @click="$emit('close')">&times;</button>
      <h2 class="text-xl font-bold mb-4">User Management</h2>
      <form v-if="isAdmin" @submit.prevent="$emit('invite')" class="mb-4 flex flex-wrap gap-2 items-end">
        <input :value="inviteName" @input="$emit('update:inviteName', ($event.target as HTMLInputElement).value)" type="text" placeholder="Name" class="input w-32" />
        <input :value="inviteEmail" @input="$emit('update:inviteEmail', ($event.target as HTMLInputElement).value)" type="email" placeholder="Email" class="input w-48" required />
        <button type="submit" class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Invite User</button>
        <span v-if="inviteError" class="text-red-600 text-xs ml-2">{{ inviteError }}</span>
        <span v-if="inviteLink" class="text-green-600 text-xs ml-2">Invite Link: <a :href="inviteLink" target="_blank" class="underline">Open</a></span>
      </form>
      <div v-if="loading" class="text-gray-500 mb-2">Loading users...</div>
      <div v-if="error" class="text-red-600 mb-2">{{ error }}</div>
      <table v-if="!loading" class="w-full text-sm mb-4">
        <thead>
          <tr>
            <th class="text-left">Name</th>
            <th class="text-left">Email</th>
            <th class="text-left">Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.uid">
            <td>{{ u.displayName || u.email }}</td>
            <td>{{ u.email }}</td>
            <td>
              <span v-if="u.isAdmin" class="text-green-700 font-semibold">Admin</span>
              <span v-else class="text-gray-700">User</span>
            </td>
            <td class="flex gap-2">
              <button v-if="!u.isAdmin" class="px-2 py-1 bg-green-600 text-white rounded" @click="$emit('promote', u)">Promote</button>
              <button v-if="u.isAdmin" class="px-2 py-1 bg-yellow-600 text-white rounded" @click="$emit('demote', u)">Demote</button>
              <button class="px-2 py-1 bg-red-600 text-white rounded" @click="$emit('delete', u)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  users: any[],
  isAdmin: boolean,
  loading: boolean,
  error: string,
  inviteName: string,
  inviteEmail: string,
  inviteError: string,
  inviteLink: string
}>()
</script> 