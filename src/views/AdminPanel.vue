<template>
  <div class="max-w-3xl mx-auto p-8">
    <h1 class="text-2xl font-bold mb-6">Admin Panel</h1>
    <div class="flex gap-2 mb-4">
      <button class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" @click="exportQuizzes">Export Quizzes</button>
      <label class="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600 cursor-pointer">
        Import Quizzes
        <input type="file" accept="application/json" class="hidden" @change="importQuizzes" />
      </label>
      <button class="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700" @click="showAnalytics = true">View Analytics</button>
      <button class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700" @click="showLeaderboard = true">Leaderboard</button>
      <button class="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700" @click="exportAnalytics">Export Analytics</button>
      <button class="px-3 py-1 bg-pink-600 text-white rounded hover:bg-pink-700" @click="showUserMgmt = true">User Management</button>
    </div>
    <AdminQuizList v-if="!showForm" @create="onCreate" @edit="onEdit" @delete="onDelete" />
    <AdminQuizForm
      v-else
      :model-value="editingQuiz"
      @save="onSave"
      @cancel="onCancel"
    />
    <div v-if="showAnalytics" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-2xl w-full relative overflow-auto">
        <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" @click="showAnalytics = false">&times;</button>
        <h2 class="text-xl font-bold mb-4">Quiz Analytics</h2>
        <div v-for="quiz in quizzes" :key="quiz.id" class="mb-8">
          <div class="font-semibold mb-1">{{ quiz.title }}</div>
          <div class="text-sm mb-1">Attempts: {{ attempts(quiz.id) }}, Average Score: {{ avgScore(quiz.id) }}, Avg. Time: {{ avgTime(quiz.id) }}</div>
          <canvas :id="'chart-' + quiz.id" height="120"></canvas>
          <div v-if="quiz.questions.length" class="mt-4">
            <h4 class="font-semibold mb-2 text-sm">Per-Question Stats</h4>
            <canvas :id="'qchart-' + quiz.id" height="80"></canvas>
            <ul class="text-xs space-y-1 mt-2">
              <li v-for="(q, qidx) in quiz.questions" :key="q.id">
                <span class="font-bold">Q{{ qidx + 1 }}:</span> {{ q.content }} —
                <span>Correct: {{ questionCorrectPct(quiz.id, q.id) }}%</span>
                <span v-if="mostMissedOption(quiz.id, q.id)">, Most Missed: {{ mostMissedOption(quiz.id, q.id) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showLeaderboard" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-xl w-full relative overflow-auto">
        <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" @click="showLeaderboard = false">&times;</button>
        <h2 class="text-xl font-bold mb-4">Leaderboard</h2>
        <ol class="list-decimal pl-6">
          <li v-for="(entry, idx) in leaderboard" :key="entry.userId" class="mb-2">
            <span class="font-semibold">{{ userName(entry.userId) }}</span>
            <span v-if="userInfo(entry.userId)"> ({{ userInfo(entry.userId).email }})</span>
            — Total Score: <span class="font-mono">{{ entry.totalScore }}</span>
          </li>
        </ol>
      </div>
    </div>
    <div v-if="showUserMgmt" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-xl w-full relative overflow-auto">
        <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" @click="showUserMgmt = false">&times;</button>
        <h2 class="text-xl font-bold mb-4">User Management</h2>
        <table class="w-full text-sm mb-4">
          <thead>
            <tr>
              <th class="text-left">Name</th>
              <th class="text-left">Email</th>
              <th class="text-left">Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td>{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td>
                <span v-if="u.isAdmin" class="text-green-700 font-semibold">Admin</span>
                <span v-else class="text-gray-700">User</span>
              </td>
              <td class="flex gap-2">
                <button v-if="!u.isAdmin" class="px-2 py-1 bg-green-600 text-white rounded" @click="promote(u)">Promote</button>
                <button v-if="u.isAdmin" class="px-2 py-1 bg-yellow-600 text-white rounded" @click="demote(u)">Demote</button>
                <button class="px-2 py-1 bg-red-600 text-white rounded" @click="deleteUser(u)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuizStore } from '../store/quiz'
import { useUserResultStore } from '../store/userResult'
import { useAuthStore } from '../store/auth'
import AdminQuizList from '../components/AdminQuizList.vue'
import AdminQuizForm from '../components/AdminQuizForm.vue'
import type { Quiz } from '../types/quiz'
import { nextTick } from 'vue'

const quizStore = useQuizStore()
const userResultStore = useUserResultStore()
const authStore = useAuthStore()
const { quizzes } = storeToRefs(quizStore)
const { results } = storeToRefs(userResultStore)
const { user } = storeToRefs(authStore)

const showForm = ref(false)
const editingQuiz = ref<Quiz | null>(null)
const showAnalytics = ref(false)
const showLeaderboard = ref(false)
const showUserMgmt = ref(false)
const users = ref([
  // Example/mock users; replace with real user list from backend or auth store
  { id: '1', name: 'Alice', email: 'alice@example.com', isAdmin: true },
  { id: '2', name: 'Bob', email: 'bob@example.com', isAdmin: false },
  { id: '3', name: 'Carol', email: 'carol@example.com', isAdmin: false },
])

function onCreate() {
  editingQuiz.value = null
  showForm.value = true
}

function onEdit(quiz: Quiz) {
  editingQuiz.value = quiz
  showForm.value = true
}

function onDelete(id: string) {
  if (confirm('Are you sure you want to delete this quiz?')) {
    quizStore.deleteQuiz(id)
  }
}

function onSave(quiz: Quiz) {
  if (editingQuiz.value) {
    quizStore.updateQuiz(quiz)
  } else {
    quizStore.addQuiz({ ...quiz, id: Date.now().toString(), questions: quiz.questions || [] })
  }
  showForm.value = false
}

function onCancel() {
  showForm.value = false
}

function exportQuizzes() {
  const data = JSON.stringify(quizStore.quizzes, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'quizzes.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function importQuizzes(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || !input.files[0]) return
  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target?.result as string)
      if (Array.isArray(imported)) {
        let added = 0, updated = 0
        imported.forEach(q => {
          if (q.id && q.title && q.questions) {
            const existing = quizStore.quizzes.find(existingQ => existingQ.id === q.id)
            if (existing) {
              quizStore.updateQuiz({ ...existing, ...q })
              updated++
            } else {
              quizStore.addQuiz(q)
              added++
            }
          }
        })
        alert(`Import complete. Added: ${added}, Updated: ${updated}`)
      }
    } catch (err) {
      alert('Invalid quizzes file.')
    }
  }
  reader.readAsText(file)
}

// Analytics helpers
function attempts(quizId: string) {
  return results.value.filter(r => r.quizId === quizId).length
}
function avgScore(quizId: string) {
  const quizResults = results.value.filter(r => r.quizId === quizId)
  if (!quizResults.length) return 0
  const sum = quizResults.reduce((acc, r) => acc + r.score, 0)
  return (sum / quizResults.length).toFixed(2)
}
function avgTime(quizId: string) {
  const quizResults = results.value.filter(r => r.quizId === quizId)
  if (!quizResults.length) return '0s'
  const sum = quizResults.reduce((acc, r) => acc + (new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()), 0)
  const avgMs = sum / quizResults.length
  if (avgMs < 1000) return '<1s'
  if (avgMs < 60000) return Math.round(avgMs / 1000) + 's'
  return (avgMs / 60000).toFixed(1) + 'm'
}
function questionCorrectPct(quizId: string, questionId: string) {
  const quiz = quizzes.value.find(q => q.id === quizId)
  if (!quiz) return 0
  const q = quiz.questions.find(q => q.id === questionId)
  if (!q) return 0
  const quizResults = results.value.filter(r => r.quizId === quizId)
  if (!quizResults.length) return 0
  let correct = 0
  quizResults.forEach(r => {
    if (q.type === 'multiple-choice') {
      if (r.answers[questionId] === q.correctAnswers[0]) correct++
    } else if (q.type === 'multiple-answer') {
      const userAns = Array.isArray(r.answers[questionId]) ? r.answers[questionId] : []
      const correctSet = new Set(q.correctAnswers)
      if (userAns.length && userAns.every(a => correctSet.has(a)) && userAns.length === q.correctAnswers.length) correct++
    } else if (q.type === 'short-text') {
      if ((r.answers[questionId] || '').trim().toLowerCase() === (q.correctAnswers[0] || '').trim().toLowerCase()) correct++
    }
  })
  return Math.round((correct / quizResults.length) * 100)
}
function mostMissedOption(quizId: string, questionId: string) {
  const quiz = quizzes.value.find(q => q.id === quizId)
  if (!quiz) return ''
  const q = quiz.questions.find(q => q.id === questionId)
  if (!q || !q.options) return ''
  const quizResults = results.value.filter(r => r.quizId === quizId)
  if (!quizResults.length) return ''
  const missCounts: Record<string, number> = {}
  q.options.forEach(opt => { missCounts[opt] = 0 })
  quizResults.forEach(r => {
    if (q.type === 'multiple-choice' || q.type === 'multiple-answer') {
      const userAns = q.type === 'multiple-answer' ? (Array.isArray(r.answers[questionId]) ? r.answers[questionId] : []) : [r.answers[questionId]]
      q.options.forEach(opt => {
        if (!userAns.includes(opt) && q.correctAnswers.includes(opt)) missCounts[opt]++
      })
    }
  })
  const mostMissed = Object.entries(missCounts).sort((a, b) => b[1] - a[1])[0]
  return mostMissed && mostMissed[1] > 0 ? mostMissed[0] : ''
}

// Score distribution chart
let chartInstances: Record<string, any> = {}
watch([showAnalytics, quizzes, results], ([show]) => {
  if (show) {
    nextTick(() => {
      quizzes.value.forEach(quiz => {
        const ctx = document.getElementById('chart-' + quiz.id) as HTMLCanvasElement
        if (ctx) {
          if (chartInstances[quiz.id]) chartInstances[quiz.id].destroy()
          const quizResults = results.value.filter(r => r.quizId === quiz.id)
          const bins = Array(11).fill(0)
          quizResults.forEach(r => {
            const idx = Math.round((r.score / quiz.questions.length) * 10)
            bins[Math.min(idx, 10)]++
          })
          import('chart.js/auto').then(({ default: Chart }) => {
            chartInstances[quiz.id] = new Chart(ctx, {
              type: 'bar',
              data: {
                labels: Array.from({ length: 11 }, (_, i) => `${i * 10}%`),
                datasets: [{ label: 'Attempts', data: bins, backgroundColor: '#2563eb' }]
              },
              options: { responsive: false, plugins: { legend: { display: false } } }
            })
          })
        }
        // Per-question correct % chart
        const ctxQ = document.getElementById('qchart-' + quiz.id) as HTMLCanvasElement
        if (ctxQ) {
          if (chartInstances['q' + quiz.id]) chartInstances['q' + quiz.id].destroy()
          const labels = quiz.questions.map((q, i) => `Q${i + 1}`)
          const data = quiz.questions.map(q => questionCorrectPct(quiz.id, q.id))
          import('chart.js/auto').then(({ default: Chart }) => {
            chartInstances['q' + quiz.id] = new Chart(ctxQ, {
              type: 'bar',
              data: {
                labels,
                datasets: [{ label: '% Correct', data, backgroundColor: '#059669' }]
              },
              options: { responsive: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }
            })
          })
        }
      })
    })
  }
})

// Leaderboard
const leaderboard = computed(() => {
  const userScores: Record<string, number> = {}
  results.value.forEach(r => {
    userScores[r.userId] = (userScores[r.userId] || 0) + r.score
  })
  return Object.entries(userScores)
    .map(([userId, totalScore]) => ({ userId, totalScore }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10)
})
function userName(userId: string) {
  // Try to get from auth store, fallback to userId
  if (user.value && user.value.id === userId) return user.value.name
  return userId
}

function exportAnalytics() {
  const data = quizzes.value.map(quiz => ({
    id: quiz.id,
    title: quiz.title,
    attempts: attempts(quiz.id),
    avgScore: avgScore(quiz.id),
    avgTime: avgTime(quiz.id),
    perQuestion: quiz.questions.map(q => ({
      id: q.id,
      content: q.content,
      correctPct: questionCorrectPct(quiz.id, q.id),
      mostMissed: mostMissedOption(quiz.id, q.id)
    }))
  }))
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'quiz-analytics.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// More user info for leaderboard
function userInfo(userId: string) {
  // Try to get from auth store, fallback to userId
  if (user.value && user.value.id === userId) return user.value
  // Optionally, look up from a user list if available
  return null
}

function promote(u) {
  u.isAdmin = true
}
function demote(u) {
  u.isAdmin = false
}
function deleteUser(u) {
  if (confirm(`Delete user ${u.name}?`)) {
    users.value = users.value.filter(user => user.id !== u.id)
  }
}
</script> 