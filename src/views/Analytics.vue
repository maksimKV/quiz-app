<template>
  <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl mt-12 border border-gray-200 dark:border-gray-700">
    <h1 class="text-3xl font-extrabold mb-8 text-center text-purple-700 dark:text-purple-300">Quiz Analytics</h1>
    <AdminAnalyticsModal :quizzes="quizzes" :results="results" />
  </div>
</template>

<script setup lang="ts">
import { useQuizStore } from '../store/quiz'
import { useUserResultStore } from '../store/userResult'
import { storeToRefs } from 'pinia'
import AdminAnalyticsModal from '../components/AdminAnalyticsModal.vue'

const quizStore = useQuizStore()
const userResultStore = useUserResultStore()
const { quizzes } = storeToRefs(quizStore)
const { results } = storeToRefs(userResultStore)
</script> 