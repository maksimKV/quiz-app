<template>
  <div>
    <h2 class="text-2xl font-extrabold mb-6 text-blue-700 dark:text-blue-300">Available Quizzes</h2>
    <div v-if="loading" class="text-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      <p class="mt-2 text-gray-500">Loading quizzes...</p>
    </div>
    <div v-else-if="error" class="text-red-500 p-4 text-center bg-red-100 rounded-lg shadow mb-4">{{ error }}</div>
    <div v-else-if="quizzes.length === 0" class="text-gray-500">No published quizzes available.</div>
    <ul v-else class="space-y-4">
      <li v-for="quiz in quizzes" :key="quiz.id" class="flex items-center justify-between bg-white/90 dark:bg-gray-900/90 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700 transition hover:bg-blue-50 dark:hover:bg-blue-900">
        <div>
          <div class="font-bold text-lg">{{ quiz.title }}</div>
          <div class="text-sm text-gray-500">{{ quiz.description }}</div>
          <div class="text-xs mt-2">
            <span v-for="tag in quiz.tags" :key="tag" class="inline-block bg-blue-100 text-blue-800 rounded px-2 py-0.5 mr-1">{{ tag }}</span>
          </div>
        </div>
        <button class="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition" @click="$emit('start', quiz)">Start</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useQuizStore } from '../store/quiz'

const quizStore = useQuizStore()
const { quizzes, loading, error } = storeToRefs(quizStore)
</script> 