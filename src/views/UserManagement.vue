<template>
  <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl mt-12 border border-gray-200 dark:border-gray-700">
    <h1 class="text-3xl font-extrabold mb-8 text-center text-pink-700 dark:text-pink-300">User Management</h1>
    <AdminUserManagementModal />
  </div>
</template>

<script setup lang="ts">
import AdminUserManagementModal from '../components/AdminUserManagementModal.vue'
</script> 