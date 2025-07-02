<template>
  <div class="max-w-3xl mx-auto p-8">
    <div v-if="globalLoading" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow flex items-center gap-2">
        <svg class="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
        <span>Loading...</span>
      </div>
    </div>
    <div v-if="globalError" class="mb-4 p-3 bg-red-100 text-red-700 rounded shadow flex items-center justify-between">
      <span>{{ globalError }}</span>
      <button class="ml-4 px-2 py-1 bg-red-300 rounded" @click="globalError = ''">Dismiss</button>
    </div>
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
    <AdminAnalyticsModal
      v-if="showAnalytics"
      :quizzes="quizzes"
      :results="results"
      :show="showAnalytics"
      @close="showAnalytics = false"
    />
    <AdminLeaderboardModal
      v-if="showLeaderboard"
      :leaderboard="leaderboard"
      :user="user"
      :userInfo="userInfo"
      @close="showLeaderboard = false"
    />
    <AdminUserManagementModal
      v-if="showUserMgmt"
      :users="users"
      :isAdmin="isAdmin"
      :loading="userMgmtLoading"
      :error="userMgmtError"
      :inviteName="inviteName"
      :inviteEmail="inviteEmail"
      :inviteError="inviteError"
      :inviteLink="inviteLink"
      @close="showUserMgmt = false"
      @invite="inviteUser"
      @promote="promote"
      @demote="demote"
      @delete="deleteUser"
      @update:inviteName="inviteName = $event"
      @update:inviteEmail="inviteEmail = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuizStore } from '../store/quiz'
import { useUserResultStore } from '../store/userResult'
import { useAuthStore } from '../store/auth'
import AdminQuizList from '../components/AdminQuizList.vue'
import AdminQuizForm from '../components/AdminQuizForm.vue'
import type { Quiz } from '../types/quiz'
import { nextTick } from 'vue'
import { useAuth } from '../composables/useAuth'
import AdminAnalyticsModal from '../components/AdminAnalyticsModal.vue'
import AdminLeaderboardModal from '../components/AdminLeaderboardModal.vue'
import AdminUserManagementModal from '../components/AdminUserManagementModal.vue'
import type Chart from 'chart.js/auto'

/// <reference types="chart.js" />

const quizStore = useQuizStore()
const userResultStore = useUserResultStore()
const authStore = useAuthStore()
const { quizzes } = storeToRefs(quizStore)
const { results } = storeToRefs(userResultStore)
const { user } = storeToRefs(authStore)
const { user: firebaseAuthUser, firebaseUser, loading, error, signup, login, logout } = useAuth()

const showForm = ref(false)
const editingQuiz = ref<Quiz | null>(null)
const showAnalytics = ref(false)
const showLeaderboard = ref(false)
const showUserMgmt = ref(false)
const inviteEmail = ref('')
const invitePassword = ref('')
const inviteName = ref('')
const inviteError = ref('')
const inviteLink = ref('')
const users = ref([])
const userMgmtLoading = ref(false)
const userMgmtError = ref('')
const isAdmin = computed(() => firebaseAuthUser.value && firebaseAuthUser.value.isAdmin)
const globalError = ref('')
const globalLoading = ref(false)

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
      if (typeof r.answers[questionId] === 'string' && r.answers[questionId] === q.correctAnswers[0]) correct++
    } else if (q.type === 'multiple-answer') {
      const userAns = Array.isArray(r.answers[questionId]) ? r.answers[questionId] : []
      const correctSet = new Set(q.correctAnswers)
      if (userAns.length && userAns.every((a: string) => correctSet.has(a)) && userAns.length === q.correctAnswers.length) correct++
    } else if (q.type === 'short-text') {
      const ans = typeof r.answers[questionId] === 'string' ? r.answers[questionId] : ''
      if (ans.trim().toLowerCase() === (q.correctAnswers[0] || '').trim().toLowerCase()) correct++
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
      const userAns = q.type === 'multiple-answer' ? (Array.isArray(r.answers[questionId]) ? r.answers[questionId] : []) : (typeof r.answers[questionId] === 'string' ? [r.answers[questionId]] : [])
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
          // @ts-ignore
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
          // @ts-ignore
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
  if (firebaseAuthUser.value && firebaseAuthUser.value.id === userId) return firebaseAuthUser.value.name
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
  if (firebaseAuthUser.value && firebaseAuthUser.value.id === userId) return firebaseAuthUser.value
  // Optionally, look up from a user list if available
  return null
}

async function inviteUser() {
  inviteError.value = ''
  inviteLink.value = ''
  globalError.value = ''
  globalLoading.value = true
  try {
    const token = firebaseUser.value ? await firebaseUser.value.getIdToken() : ''
    const res = await fetch('/api/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: inviteEmail.value, name: inviteName.value })
    })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    inviteLink.value = data.inviteLink
    inviteEmail.value = ''
    inviteName.value = ''
  } catch (e: any) {
    inviteError.value = e.message || 'Failed to invite user.'
    globalError.value = inviteError.value
  } finally {
    globalLoading.value = false
  }
}

async function fetchUsers() {
  userMgmtLoading.value = true
  userMgmtError.value = ''
  globalError.value = ''
  globalLoading.value = true
  try {
    const token = firebaseUser.value ? await firebaseUser.value.getIdToken() : ''
    const res = await fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error(await res.text())
    users.value = await res.json()
  } catch (e: any) {
    userMgmtError.value = e.message || 'Failed to fetch users.'
    globalError.value = userMgmtError.value
  } finally {
    userMgmtLoading.value = false
    globalLoading.value = false
  }
}

async function userMgmtAction(url, body, method = 'POST') {
  userMgmtError.value = ''
  globalError.value = ''
  globalLoading.value = true
  try {
    const token = firebaseUser.value ? await firebaseUser.value.getIdToken() : ''
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined
    })
    if (!res.ok) throw new Error(await res.text())
    await fetchUsers()
  } catch (e: any) {
    userMgmtError.value = e.message || 'Action failed.'
    globalError.value = userMgmtError.value
  } finally {
    globalLoading.value = false
  }
}

async function promote(u) { await userMgmtAction('/api/users/promote', { uid: u.uid }) }
async function demote(u) { await userMgmtAction('/api/users/demote', { uid: u.uid }) }
async function deleteUser(u) { if (!confirm(`Delete user ${u.displayName || u.email}?`)) return; await userMgmtAction(`/api/users/${u.uid}`, null, 'DELETE') }

onMounted(() => {
  if (showUserMgmt.value) fetchUsers()
})
watch(showUserMgmt, (val) => { if (val) fetchUsers() })
</script> 