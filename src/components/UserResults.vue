<template>
  <div class="mb-8">
    <h2 class="text-xl font-extrabold mb-4 text-blue-700 dark:text-blue-300">Your Past Results</h2>
    <div v-if="loading" class="text-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      <p class="mt-2 text-gray-500">Loading results...</p>
    </div>
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 shadow">
      {{ error }}
    </div>
    <div v-else>
      <div class="flex flex-wrap gap-2 mb-4">
        <label class="text-sm">Sort by:
          <select v-model="sortKey" class="ml-1 px-2 py-1 rounded border">
            <option value="date">Date</option>
            <option value="score">Score</option>
          </select>
        </label>
        <label class="text-sm">Filter by Quiz:
          <select v-model="filterQuizId" class="ml-1 px-2 py-1 rounded border">
            <option value="">All</option>
            <option v-for="q in quizzes" :key="q.id" :value="q.id">{{ q.title }}</option>
          </select>
        </label>
        <button class="ml-auto px-4 py-1 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" @click="exportResults">Export</button>
        <label class="px-4 py-1 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg shadow hover:bg-gray-400 dark:hover:bg-gray-600 cursor-pointer transition">
          Import
          <input type="file" accept="application/json" class="hidden" @change="importResults" />
        </label>
      </div>
      <div v-if="sortedResults.length === 0" class="text-gray-500">No results yet.</div>
      <ul v-else class="space-y-3">
        <li v-for="r in sortedResults" :key="r.id" class="flex items-center justify-between bg-white/90 dark:bg-gray-900/90 rounded-xl shadow p-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 border border-gray-200 dark:border-gray-700 transition">
          <div>
            <div class="font-bold text-lg">{{ quizTitle(r.quizId) }}</div>
            <div class="text-xs text-gray-500">{{ formatDate(r.completedAt) }}</div>
          </div>
          <div class="text-sm">
            Score: <span class="font-mono">{{ r.score }}/{{ r.maxScore }}</span>
            <span class="text-xs ml-1">({{ Math.round(r.percentage) }}%)</span>
          </div>
        </li>
      </ul>
      <div v-if="reviewResult" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
        <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-2xl w-full relative border border-gray-200 dark:border-gray-700">
          <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl font-bold" @click="reviewResult = null">&times;</button>
          <QuizPlayerView :quiz="quizForReview" :review-answers="reviewResult.answers" :force-review="true" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserResultStore } from '../store/userResult'
import { useQuizStore } from '../store/quiz'
import type { UserResult } from '../types/userResult'
import QuizPlayerView from './QuizPlayerView.vue'

const props = defineProps<{ userId: string }>()
const userResultStore = useUserResultStore()
const quizStore = useQuizStore()
const { quizzes } = storeToRefs(quizStore)

const sortKey = ref('date')
const filterQuizId = ref('')
const reviewResult = ref<UserResult | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const results = ref<UserResult[]>([])

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    results.value = await userResultStore.getResultsByUser(props.userId)
  } catch (err) {
    error.value = (err as Error).message
    console.error('Failed to load results:', err)
  } finally {
    loading.value = false
  }
})

const filteredResults = computed(() => {
  if (!filterQuizId.value) return results.value
  return results.value.filter(r => r.quizId === filterQuizId.value)
})

const sortedResults = computed(() => {
  const arr = [...filteredResults.value]
  if (sortKey.value === 'score') {
    arr.sort((a, b) => b.percentage - a.percentage)
  } else {
    arr.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  }
  return arr
})

function quizTitle(quizId: string) {
  return quizzes.value.find(q => q.id === quizId)?.title || 'Unknown Quiz'
}

function formatDate(date: string) {
  return new Date(date).toLocaleString()
}

function showReview(result: UserResult) {
  reviewResult.value = result
}

const quizForReview = computed(() => {
  if (!reviewResult.value) return null
  const quiz = quizzes.value.find(q => q.id === reviewResult.value?.quizId)
  if (!quiz) return null
  // Return a copy with questions, but don't mutate the original
  return JSON.parse(JSON.stringify(quiz))
})

function exportResults() {
  const data = JSON.stringify(results.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'quiz-results.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function importResults(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || !input.files[0]) return

  loading.value = true
  error.value = null

  try {
    const file = input.files[0]
    const text = await file.text()
    const imported = JSON.parse(text)

    if (Array.isArray(imported)) {
      let added = 0
      for (const r of imported) {
        if (r.userId === props.userId) {
          await userResultStore.addResult(r)
          added++
        }
      }
      results.value = await userResultStore.getResultsByUser(props.userId)
      alert(`Import complete. Added: ${added} results`)
    }
  } catch (err) {
    error.value = 'Failed to import results. Please check the file format.'
    console.error('Import error:', err)
  } finally {
    loading.value = false
    if (input.form) input.form.reset()
  }
}
</script> 