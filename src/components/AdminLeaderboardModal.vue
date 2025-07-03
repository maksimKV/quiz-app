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
      <h2 class="text-2xl font-extrabold mb-6 text-purple-700 dark:text-purple-300 text-center">
        Leaderboard
      </h2>
      <div class="w-full max-w-3xl mx-auto">
        <ol class="list-decimal pl-8 space-y-2">
          <li
            v-for="entry in leaderboard"
            :key="entry.userId"
            class="bg-gray-50 dark:bg-gray-900 rounded-lg shadow p-4 flex items-center justify-between border border-gray-200 dark:border-gray-700 w-full"
          >
            <div>
              <span class="font-semibold text-lg">{{ userName(entry.userId) }}</span>
              <span v-if="userInfo(entry.userId)?.email" class="text-xs text-gray-500">
                ({{ userInfo(entry.userId)?.email }})
              </span>
            </div>
            <div class="text-blue-700 dark:text-blue-300 font-mono font-bold">
              {{ entry.totalScore }}
            </div>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from '../types/user'
const props = defineProps<{
  leaderboard: { userId: string; totalScore: number }[]
  user: User | null
  userInfo: (userId: string) => User | undefined
}>()

defineEmits<{
  close: []
}>()

function userName(userId: string) {
  if (props.user && props.user.id === userId) return props.user.name
  return userId
}
</script>
