<template>
  <div class="mb-8">
    <h2 class="text-lg font-semibold mb-2">Your Past Results</h2>
    <div class="flex flex-wrap gap-2 mb-2">
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
      <button class="ml-auto px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" @click="exportResults">Export</button>
      <label class="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600 cursor-pointer">
        Import
        <input type="file" accept="application/json" class="hidden" @change="importResults" />
      </label>
    </div>
    <div v-if="sortedResults.length === 0" class="text-gray-500">No results yet.</div>
    <ul v-else class="space-y-2">
      <li v-for="r in sortedResults" :key="r.id" class="flex items-center justify-between bg-gray-100 dark:bg-gray-900 rounded shadow p-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900" @click="showReview(r)">
        <div>
          <div class="font-bold">{{ quizTitle(r.quizId) }}</div>
          <div class="text-xs text-gray-500">{{ formatDate(r.finishedAt) }}</div>
        </div>
        <div class="text-sm">Score: <span class="font-mono">{{ r.score }}</span></div>
      </li>
    </ul>
    <div v-if="reviewResult" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-2xl w-full relative">
        <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" @click="reviewResult = null">&times;</button>
        <QuizPlayerView :quiz="quizForReview" :review-answers="reviewResult.answers" :force-review="true" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserResultStore } from '../store/userResult'
import { useQuizStore } from '../store/quiz'
import QuizPlayerView from './QuizPlayerView.vue'

const props = defineProps<{ userId: string }>()
const userResultStore = useUserResultStore()
const quizStore = useQuizStore()
const { quizzes } = storeToRefs(quizStore)

const sortKey = ref('date')
const filterQuizId = ref('')
const reviewResult = ref(null)

const results = computed(() => userResultStore.getResultsByUser(props.userId))

const filteredResults = computed(() => {
  if (!filterQuizId.value) return results.value
  return results.value.filter(r => r.quizId === filterQuizId.value)
})

const sortedResults = computed(() => {
  const arr = [...filteredResults.value]
  if (sortKey.value === 'score') {
    arr.sort((a, b) => b.score - a.score)
  } else {
    arr.sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime())
  }
  return arr
})

function quizTitle(quizId: string) {
  return quizzes.value.find(q => q.id === quizId)?.title || 'Unknown Quiz'
}
function formatDate(date: string) {
  return new Date(date).toLocaleString()
}
function showReview(result) {
  reviewResult.value = result
}
const quizForReview = computed(() => {
  if (!reviewResult.value) return null
  const quiz = quizzes.value.find(q => q.id === reviewResult.value.quizId)
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

function importResults(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || !input.files[0]) return
  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target?.result as string)
      if (Array.isArray(imported)) {
        let added = 0, updated = 0
        imported.forEach(r => {
          if (r.userId === props.userId) {
            const existing = userResultStore.results.find(er => er.id === r.id)
            if (existing) {
              Object.assign(existing, r)
              updated++
            } else {
              userResultStore.addResult(r)
              added++
            }
          }
        })
        alert(`Import complete. Added: ${added}, Updated: ${updated}`)
      }
    } catch (err) {
      alert('Invalid results file.')
    }
  }
  reader.readAsText(file)
}
</script> 