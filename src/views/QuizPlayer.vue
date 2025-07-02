<template>
  <div class="max-w-3xl mx-auto p-8">
    <div class="mb-8">
      <UserResults v-if="user" :user-id="user.id" />
    </div>
    <div v-if="!selectedQuiz && !showResults">
      <QuizList @start="startQuiz" />
    </div>
    <div v-else-if="selectedQuiz && !showResults">
      <QuizPlayerView :quiz="selectedQuiz" @submit="onSubmit" />
    </div>
    <div
      v-else
      class="bg-white/90 dark:bg-gray-800/90 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 mt-8 text-center"
    >
      <h2 class="text-2xl font-extrabold mb-4 text-blue-700 dark:text-blue-300">Quiz Results</h2>
      <div class="mb-4 text-lg font-semibold">
        Score: <span class="text-green-600">{{ scoreDisplay }}</span> / {{ total }}
      </div>
      <button
        class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        @click="reset"
      >
        Back to Quiz List
      </button>
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
import type { Quiz, Question } from '../types/quiz'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const userResultStore = useUserResultStore()

const selectedQuiz = ref<Quiz | null>(null)
const showResults = ref<boolean>(false)
const lastAnswers = ref<Record<string, string | string[]>>({})
const score = ref<number>(0)
const total = ref<number>(0)

const scoreDisplay = computed(() =>
  Number.isInteger(score.value) ? score.value : score.value.toFixed(2)
)

function startQuiz(quiz: Quiz) {
  selectedQuiz.value = quiz
  showResults.value = false
  lastAnswers.value = {}
}

function onSubmit(answers: Record<string, string | string[]>) {
  lastAnswers.value = answers
  score.value = 0
  total.value = selectedQuiz.value?.questions.length || 0
  selectedQuiz.value?.questions.forEach((q: Question) => {
    if (q.type === 'multiple-choice') {
      if (answers[q.id] === q.correctAnswers[0]) score.value++
    } else if (q.type === 'multiple-answer') {
      const userAns = Array.isArray(answers[q.id]) ? answers[q.id] : []
      const correct = q.correctAnswers
      const totalCorrect = correct.length
      const totalOptions = q.options?.length || 0
      const numCorrectSelected = (userAns as string[]).filter((a: string) =>
        correct.includes(a)
      ).length
      const numIncorrectSelected = (userAns as string[]).filter(
        (a: string) => !correct.includes(a)
      ).length
      let partial = 0
      if (totalCorrect > 0 && totalOptions > 0) {
        partial = numCorrectSelected / totalCorrect - numIncorrectSelected / totalOptions
        if (partial < 0) partial = 0
      }
      score.value += partial
    } else if (q.type === 'short-text') {
      const ans = typeof answers[q.id] === 'string' ? answers[q.id] : ''
      if ((ans as string).trim().toLowerCase() === (q.correctAnswers[0] || '').trim().toLowerCase())
        score.value++
    }
  })
  // Save result to userResult store
  if (user.value && selectedQuiz.value) {
    userResultStore.addResult({
      userId: user.value.id,
      quizId: selectedQuiz.value.id,
      score: score.value,
      maxScore: selectedQuiz.value.questions.length,
      percentage: (score.value / selectedQuiz.value.questions.length) * 100,
      answers,
      completedAt: new Date().toISOString(),
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

defineExpose({
  selectedQuiz,
  showResults,
  scoreDisplay,
  total,
  startQuiz,
  onSubmit,
  reset,
  user,
})
</script>
