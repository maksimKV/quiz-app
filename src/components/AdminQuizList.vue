<template>
  <div>
    <h2 class="text-xl font-semibold mb-4">Quizzes</h2>
    <div v-if="loading" class="text-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      <p class="mt-2 text-gray-500">Loading quizzes...</p>
    </div>
    <div v-else-if="error" class="text-red-500 p-4 text-center">
      {{ error }}
    </div>
    <div v-else-if="quizzes.length === 0" class="text-gray-500">No quizzes found.</div>
    <ul v-else class="space-y-2">
      <li v-for="quiz in quizzes" :key="quiz.id" class="flex items-center justify-between bg-white dark:bg-gray-800 rounded shadow p-4">
        <div>
          <div class="font-bold">{{ quiz.title }}</div>
          <div class="text-sm text-gray-500">{{ quiz.description }}</div>
          <div class="text-xs mt-1">
            <span v-for="tag in quiz.tags" :key="tag" class="inline-block bg-blue-100 text-blue-800 rounded px-2 py-0.5 mr-1">{{ tag }}</span>
            <span v-if="quiz.published" class="ml-2 text-green-600 font-semibold">Published</span>
            <span v-else class="ml-2 text-yellow-600 font-semibold">Draft</span>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600" @click="$emit('edit', quiz)">Edit</button>
          <button 
            class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600" 
            @click="handleDelete(quiz.id)"
            :disabled="loading"
          >Delete</button>
          <button 
            class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600" 
            @click="$emit('preview', quiz)"
          >Preview</button>
        </div>
      </li>
    </ul>
    <button 
      class="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" 
      @click="$emit('create')"
      :disabled="loading"
    >Create New Quiz</button>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useQuizStore } from '../store/quiz'
import { onMounted } from 'vue'

const quizStore = useQuizStore()
const { quizzes, loading, error } = storeToRefs(quizStore)

onMounted(async () => {
  // await quizStore.fetchQuizzes()
})

const handleDelete = async (id: string) => {
  if (confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
    await quizStore.deleteQuiz(id)
  }
}
</script> 