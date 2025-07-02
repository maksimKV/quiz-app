<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
    <div class="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-xl w-full relative overflow-auto">
      <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" @click="$emit('close')">&times;</button>
      <h2 class="text-xl font-bold mb-4">Leaderboard</h2>
      <ol class="list-decimal pl-6">
        <li v-for="(entry, idx) in leaderboard" :key="entry.userId" class="mb-2">
          <span class="font-semibold">{{ userName(entry.userId) }}</span>
          <span v-if="userInfo(entry.userId)"> ({{ userInfo(entry.userId).email }})</span>
          — Total Score: <span class="font-mono">{{ entry.totalScore }}</span>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  leaderboard: { userId: string, totalScore: number }[],
  user: any,
  userInfo: (userId: string) => any
}>()

function userName(userId: string) {
  if (props.user && props.user.id === userId) return props.user.name
  return userId
}
</script> 