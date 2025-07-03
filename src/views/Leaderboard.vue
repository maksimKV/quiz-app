<template>
  <div
    class="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl mt-12 border border-gray-200 dark:border-gray-700"
  >
    <h1 class="text-3xl font-extrabold mb-4 text-center text-yellow-700 dark:text-yellow-300">
      Leaderboard
    </h1>
    <p class="text-center text-gray-600 dark:text-gray-300 mb-8">
      See how you rank against other players! Scores are updated in real time.
    </p>
    <div class="w-full max-w-3xl mx-auto">
      <ol class="list-decimal pl-8 space-y-2">
        <li
          v-for="entry in leaderboard"
          :key="entry.userId"
          class="bg-gray-50 dark:bg-gray-900 rounded-lg shadow p-4 flex items-center justify-between border border-gray-200 dark:border-gray-700 w-full"
        >
          <div>
            <span class="font-semibold text-lg">{{
              userInfo(entry.userId)?.displayName || entry.userId
            }}</span>
            <span v-if="userInfo(entry.userId)" class="text-xs text-gray-500">
              ({{ userInfo(entry.userId)?.email }})</span
            >
          </div>
          <div class="text-blue-700 dark:text-blue-300 font-mono font-bold">
            {{ entry.totalScore }}
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuizAnalytics } from '../composables/useQuizAnalytics'
import { useAuth } from '../composables/useAuth'
import { useQuizStore } from '../store/quiz'
import { useUserResultStore } from '../store/userResult'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'

const quizStore = useQuizStore()
const userResultStore = useUserResultStore()
const { quizzes } = storeToRefs(quizStore)
const { results } = storeToRefs(userResultStore)

const { leaderboard } = useQuizAnalytics(quizzes.value, results.value)
const { user } = useAuth()

function userInfo(userId: string) {
  if (user.value && user.value.uid === userId) return user.value
  return null
}

onMounted(async () => {
  await userResultStore.fetchAllResults()
})
</script>
