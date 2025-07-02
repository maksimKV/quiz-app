<template>
  <div>
    <h2 class="text-xl font-semibold mb-4">Available Quizzes</h2>
    <div v-if="loading" class="text-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      <p class="mt-2 text-gray-500">Loading quizzes...</p>
    </div>
    <div v-else-if="error" class="text-red-500 p-4 text-center">
      {{ error }}
    </div>
    <div v-else-if="quizzes.length === 0" class="text-gray-500">No published quizzes available.</div>
    <ul v-else class="space-y-2">
      <li v-for="quiz in quizzes" :key="quiz.id" class="flex items-center justify-between bg-white dark:bg-gray-800 rounded shadow p-4">
        <div>
          <div class="font-bold">{{ quiz.title }}</div>
          <div class="text-sm text-gray-500">{{ quiz.description }}</div>
          <div class="text-xs mt-1">
            <span v-for="tag in quiz.tags" :key="tag" class="inline-block bg-blue-100 text-blue-800 rounded px-2 py-0.5 mr-1">{{ tag }}</span>
          </div>
        </div>
        <button class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700" @click="$emit('start', quiz)">Start</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useQuizStore } from '../store/quiz'
import { onMounted } from 'vue'

const quizStore = useQuizStore()
const { quizzes, loading, error } = storeToRefs(quizStore)

onMounted(async () => {
  await quizStore.fetchPublishedQuizzes()
})
</script> 