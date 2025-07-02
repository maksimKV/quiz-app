<template>
  <div class="max-w-3xl mx-auto p-8">
    <UserResults v-if="user" :user-id="user.id" />
    <QuizList v-if="!selectedQuiz && !showResults" @start="startQuiz" />
    <QuizPlayerView v-else-if="selectedQuiz && !showResults" :quiz="selectedQuiz" @submit="onSubmit" />
    <div v-else class="bg-white dark:bg-gray-800 p-6 rounded shadow">
      <h2 class="text-xl font-bold mb-4">Quiz Results</h2>
      <div class="mb-2">Score: {{ scoreDisplay }} / {{ total }}</div>
      <button class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" @click="reset">Back to Quiz List</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import QuizList from '../components/QuizList.vue'
import QuizPlayerView from '../components/QuizPlayerView.vue'
import UserResults from '../components/UserResults.vue'
import { useAuthStore } from '../store/auth'
import { useUserResultStore } from '../store/userResult'
import type { Quiz } from '../types/quiz'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const userResultStore = useUserResultStore()

const selectedQuiz = ref<Quiz | null>(null)
const showResults = ref(false)
const lastAnswers = ref<Record<string, any>>({})
const score = ref(0)
const total = ref(0)

const scoreDisplay = computed(() => Number.isInteger(score.value) ? score.value : score.value.toFixed(2))

function startQuiz(quiz: Quiz) {
  selectedQuiz.value = quiz
  showResults.value = false
  lastAnswers.value = {}
}

function onSubmit(answers: Record<string, any>) {
  lastAnswers.value = answers
  score.value = 0
  total.value = selectedQuiz.value?.questions.length || 0
  selectedQuiz.value?.questions.forEach(q => {
    if (q.type === 'multiple-choice') {
      if (answers[q.id] === q.correctAnswers[0]) score.value++
    } else if (q.type === 'multiple-answer') {
      const userAns = Array.isArray(answers[q.id]) ? answers[q.id] : []
      const correct = q.correctAnswers
      const totalCorrect = correct.length
      const totalOptions = q.options?.length || 0
      const numCorrectSelected = userAns.filter((a: string) => correct.includes(a)).length
      const numIncorrectSelected = userAns.filter((a: string) => !correct.includes(a)).length
      let partial = 0
      if (totalCorrect > 0 && totalOptions > 0) {
        partial = (numCorrectSelected / totalCorrect) - (numIncorrectSelected / totalOptions)
        if (partial < 0) partial = 0
      }
      score.value += partial
    } else if (q.type === 'short-text') {
      if ((answers[q.id] || '').trim().toLowerCase() === (q.correctAnswers[0] || '').trim().toLowerCase()) score.value++
    }
  })
  // Save result to userResult store
  if (user.value && selectedQuiz.value) {
    userResultStore.addResult({
      id: Date.now().toString(),
      userId: user.value.id,
      quizId: selectedQuiz.value.id,
      score: score.value,
      answers,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    })
  }
  showResults.value = true
}

function reset() {
  selectedQuiz.value = null
  showResults.value = false
  lastAnswers.value = {}
  score.value = 0
  total.value = 0
}
</script> 