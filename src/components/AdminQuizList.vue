<template>
  <div>
    <h2 class="text-xl font-semibold mb-4">Quizzes</h2>
    <div v-if="quizzes.length === 0" class="text-gray-500">No quizzes found.</div>
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
          <button class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600" @click="$emit('delete', quiz.id)">Delete</button>
        </div>
      </li>
    </ul>
    <button class="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" @click="$emit('create')">Create New Quiz</button>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useQuizStore } from '../store/quiz'

const quizStore = useQuizStore()
const { quizzes } = storeToRefs(quizStore)
</script> 