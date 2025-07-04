<template>
  <div
    class="p-8 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl mt-12 border border-gray-200 dark:border-gray-700"
  >
    <div
      v-if="globalLoading"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
    >
      <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl flex items-center gap-4">
        <svg
          class="animate-spin h-8 w-8 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
        <span class="text-lg font-semibold">Loading...</span>
      </div>
    </div>
    <div
      v-if="globalError"
      class="mb-4 p-4 bg-red-100 text-red-700 rounded-lg shadow flex items-center justify-between"
    >
      <span>{{ globalError }}</span>
      <button
        class="ml-4 px-3 py-1 bg-red-300 rounded hover:bg-red-400 transition"
        @click="globalError = ''"
      >
        Dismiss
      </button>
    </div>
    <div
      v-if="pdfGenerating"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
    >
      <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl flex items-center gap-4">
        <svg
          class="animate-spin h-8 w-8 text-orange-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
        <span class="text-lg font-semibold">Generating PDF, please wait...</span>
      </div>
    </div>
    <h1 class="text-3xl font-extrabold mb-8 text-center text-purple-700 dark:text-purple-300">
      Admin Panel
    </h1>
    <div class="flex flex-wrap gap-3 mb-6 justify-center">
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        @click="exportQuizzes"
      >
        Export Quizzes
      </button>
      <label
        class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg shadow hover:bg-gray-400 dark:hover:bg-gray-600 cursor-pointer transition"
      >
        Import Quizzes
        <input type="file" accept="application/json" class="hidden" @change="importQuizzes" />
      </label>
      <button
        class="px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
        @click="showAnalytics = true"
      >
        View Analytics
      </button>
      <button
        class="px-4 py-2 bg-orange-600 text-white rounded-lg shadow hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
        @click="exportAnalytics"
      >
        Export Analytics
      </button>
      <button
        class="px-4 py-2 bg-pink-600 text-white rounded-lg shadow hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
        @click="showUserManagement = true"
      >
        User Management
      </button>
    </div>
    <div class="mt-8">
      <AdminQuizList
        v-if="!showQuizForm && !previewQuiz"
        @create="onCreate"
        @edit="editQuiz"
        @delete="deleteQuiz"
        @preview="onPreview"
      />
      <div v-else-if="previewQuiz">
        <QuizPlayerView :quiz="previewQuiz" :preview="true" />
        <button
          class="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
          @click="exitPreview"
        >
          Exit Preview
        </button>
      </div>
      <AdminQuizForm v-else :model-value="selectedQuiz" @save="onSave" @cancel="onCancel" />
    </div>
    <AdminAnalyticsModal
      v-if="showAnalytics"
      :quizzes="quizzes"
      :results="results"
      :show="showAnalytics"
      @close="showAnalytics = false"
    />
    <AdminUserManagementModal
      v-if="showUserManagement"
      :users="users"
      :is-admin="isAdmin"
      :loading="userMgmtLoading"
      :error="userMgmtError"
      :invite-name="inviteName"
      :invite-email="inviteEmail"
      :invite-error="inviteError"
      :invite-link="inviteLink"
      @close="showUserManagement = false"
      @invite="inviteUser"
      @promote="promote"
      @demote="demote"
      @delete="deleteUser"
      @update:invite-name="inviteName = $event"
      @update:invite-email="inviteEmail = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuizStore } from '../store/quiz'
import { useUserResultStore } from '../store/userResult'
import { useAuthStore } from '../store/auth'
import { useQuizAnalytics } from '../composables/useQuizAnalytics'
import { quizService } from '../services/quizService'
import AdminQuizList from '../components/AdminQuizList.vue'
import AdminQuizForm from '../components/AdminQuizForm.vue'
import AdminAnalyticsModal from '../components/AdminAnalyticsModal.vue'
import AdminUserManagementModal from '../components/AdminUserManagementModal.vue'
import QuizPlayerView from '../components/QuizPlayerView.vue'
import type { Quiz } from '../types/quiz'
import type { AdminUser } from '../types/user'
import type { UserResult } from '../types/userResult'
import { useAuth } from '../composables/useAuth'
import Chart from 'chart.js/auto'
import jsPDF from 'jspdf'
import type { ChartConfiguration, ChartTypeRegistry } from 'chart.js'
import { readJsonFile } from '../utils/fileUtils'

const quizStore = useQuizStore()
const userResultStore = useUserResultStore()
const authStore = useAuthStore()
const { quizzes } = storeToRefs(quizStore)
const { results } = storeToRefs(userResultStore)
const { user } = storeToRefs(authStore)
const { authReady, firebaseUser } = useAuth()

const { attempts, avgScore, avgTime, questionCorrectPct, mostMissedOption } = useQuizAnalytics(
  quizzes.value,
  results.value
)

const showQuizForm = ref(false)
const showAnalytics = ref(false)
const showUserManagement = ref(false)
const selectedQuiz = ref<Quiz | null>(null)
const inviteEmail = ref('')
const inviteName = ref('')
const inviteError = ref('')
const inviteLink = ref('')
const users = ref([])
const userMgmtLoading = ref(false)
const userMgmtError = ref('')
const isAdmin = computed(() => !!(user.value && user.value.isAdmin))
const globalError = ref('')
const globalLoading = ref(false)
const previewQuiz = ref<Quiz | null>(null)
const pdfGenerating = ref(false)

// Chart instances
const chartInstances: Record<string, Chart> = {}

function destroyAllCharts() {
  Object.values(chartInstances).forEach(chart => chart.destroy())
  Object.keys(chartInstances).forEach(key => delete chartInstances[key])
}

function onCreate() {
  selectedQuiz.value = null
  showQuizForm.value = true
}

function editQuiz(quiz: Quiz) {
  selectedQuiz.value = quiz
  showQuizForm.value = true
}

async function deleteQuiz(quiz: Quiz) {
  if (confirm(`Are you sure you want to delete "${quiz.title}"?`)) {
    await quizStore.deleteQuiz(quiz.id)
    await quizStore.fetchQuizzes()
  }
}

async function onSave(quiz: Quiz) {
  if (selectedQuiz.value) {
    await quizStore.updateQuiz(quiz)
  } else {
    await quizStore.addQuiz(quiz)
  }
  await quizStore.fetchQuizzes()
  showQuizForm.value = false
}

function onCancel() {
  showQuizForm.value = false
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

async function importQuizzes(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || !input.files[0]) return

  try {
    const imported = await readJsonFile(input.files[0])
    if (Array.isArray(imported)) {
      let added = 0,
        updated = 0
      for (const q of imported) {
        if (q.id && q.title && q.questions) {
          const existing = quizzes.value.find((quiz: Quiz) => quiz.id === q.id)
          if (existing) {
            await quizStore.updateQuiz({ ...existing, ...q })
            updated++
          } else {
            const quizData = { ...q }
            delete quizData.id
            const newQuiz: Omit<Quiz, 'id'> = {
              title: quizData.title,
              description: quizData.description,
              tags: quizData.tags,
              published: quizData.published,
              questions: quizData.questions,
              timer: quizData.timer,
            }
            await quizStore.addQuiz(newQuiz)
            added++
          }
        }
      }
      alert(`Import complete. Added: ${added}, Updated: ${updated}`)
    }
  } catch {
    alert('Invalid quizzes file.')
  }
}

function renderChartImage(chartConfig: ChartConfiguration): Promise<string> {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 300
    chartConfig.options = chartConfig.options || {}
    chartConfig.options.animation = {
      ...chartConfig.options.animation,
      onComplete: () => {
        const imgData = canvas.toDataURL('image/png')
        chart.destroy()
        resolve(imgData)
      },
    }
    const chart = new Chart(canvas, chartConfig)
  })
}

async function exportAnalytics() {
  pdfGenerating.value = true
  try {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 40
    const imgWidth = pageWidth - margin * 2
    let y = margin
    pdf.setFontSize(20)
    pdf.text('Quiz Analytics', margin, y)
    y += 30
    for (const [idx, quiz] of quizzes.value.entries()) {
      pdf.setFontSize(16)
      pdf.text(`${idx + 1}. ${quiz.title}`, margin, y)
      y += 20
      pdf.setFontSize(12)
      pdf.text(
        `Attempts: ${attempts(quiz.id)}  |  Avg. Score: ${avgScore(quiz.id)}  |  Avg. Time: ${avgTime(quiz.id)}`,
        margin,
        y
      )
      y += 20
      // Main chart config
      const quizResults = results.value.filter(r => r.quizId === quiz.id)
      const bins = Array(11).fill(0)
      quizResults.forEach(r => {
        const idx = Math.round((r.score / quiz.questions.length) * 10)
        bins[Math.min(idx, 10)]++
      })
      const mainChartConfig = {
        type: 'bar' as keyof ChartTypeRegistry,
        data: {
          labels: Array.from({ length: 11 }, (_, i) => `${i * 10}%`),
          datasets: [{ label: 'Attempts', data: bins, backgroundColor: '#2563eb' }],
        },
        options: { responsive: false, plugins: { legend: { display: false } } },
      }
      const mainChartImg = await renderChartImage(mainChartConfig)
      const imgHeight = imgWidth * (300 / 600)
      if (y + imgHeight > pageHeight - margin) {
        pdf.addPage()
        y = margin
      }
      pdf.addImage(mainChartImg, 'PNG', margin, y, imgWidth, imgHeight)
      y += imgHeight + 10
      // Per-question chart config
      const labels = quiz.questions.map((q, i) => `Q${i + 1}`)
      const data = quiz.questions.map(q => questionCorrectPct(quiz.id, q.id))
      const perQChartConfig = {
        type: 'bar' as keyof ChartTypeRegistry,
        data: {
          labels,
          datasets: [{ label: '% Correct', data, backgroundColor: '#059669' }],
        },
        options: {
          responsive: false,
          plugins: { legend: { display: false } },
          scales: { y: { min: 0, max: 100 } },
        },
      }
      const perQChartImg = await renderChartImage(perQChartConfig)
      const perQImgHeight = imgWidth * (200 / 600)
      if (y + perQImgHeight > pageHeight - margin) {
        pdf.addPage()
        y = margin
      }
      pdf.addImage(perQChartImg, 'PNG', margin, y, imgWidth, perQImgHeight)
      y += perQImgHeight + 10
      // Per-question stats
      pdf.setFontSize(11)
      for (const [qidx, q] of quiz.questions.entries()) {
        let line = `Q${qidx + 1}: ${q.content}`
        line += ` | Correct: ${questionCorrectPct(quiz.id, q.id)}%`
        const missed = mostMissedOption(quiz.id, q.id)
        if (missed) line += ` | Most Missed: ${missed}`
        if (y + 14 > pageHeight - margin) {
          pdf.addPage()
          y = margin
        }
        pdf.text(line, margin + 10, y)
        y += 14
      }
      y += 20
      if (y > pageHeight - margin) {
        pdf.addPage()
        y = margin
      }
    }
    pdf.save('quiz-analytics.pdf')
  } finally {
    pdfGenerating.value = false
  }
}

async function inviteUser() {
  inviteError.value = ''
  inviteLink.value = ''
  globalError.value = ''
  globalLoading.value = true
  try {
    let token = ''
    if (firebaseUser.value && typeof firebaseUser.value.getIdToken === 'function') {
      token = await firebaseUser.value.getIdToken()
    }
    const res = await fetch('/api/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: inviteEmail.value, name: inviteName.value }),
    })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    inviteLink.value = data.inviteLink
    inviteEmail.value = ''
    inviteName.value = ''
  } catch (e: unknown) {
    inviteError.value = (e as Error).message || 'Failed to invite user.'
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
    let token = ''
    if (firebaseUser.value && typeof firebaseUser.value.getIdToken === 'function') {
      token = await firebaseUser.value.getIdToken()
    }
    if (!token) {
      throw new Error('No authentication token found. Please log in again.')
    }

    const res = await fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(await res.text())
    users.value = await res.json()
  } catch (e: unknown) {
    userMgmtError.value = (e as Error).message || 'Failed to fetch users.'
    globalError.value = userMgmtError.value
  } finally {
    userMgmtLoading.value = false
    globalLoading.value = false
  }
}

async function userMgmtAction(url: string, body: Record<string, unknown> | null, method = 'POST') {
  userMgmtError.value = ''
  globalError.value = ''
  globalLoading.value = true
  try {
    let token = ''
    if (firebaseUser.value && typeof firebaseUser.value.getIdToken === 'function') {
      token = await firebaseUser.value.getIdToken()
    }
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error(await res.text())
    await fetchUsers()
  } catch (e: unknown) {
    userMgmtError.value = (e as Error).message || 'Action failed.'
    globalError.value = userMgmtError.value
  } finally {
    globalLoading.value = false
  }
}

async function promote(u: AdminUser) {
  await userMgmtAction('/api/users/promote', { uid: u.uid })
}

async function demote(u: AdminUser) {
  await userMgmtAction('/api/users/demote', { uid: u.uid })
}

async function deleteUser(u: AdminUser) {
  if (!confirm(`Delete user ${u.displayName || u.email}?`)) return
  await userMgmtAction(`/api/users/${u.uid}`, null, 'DELETE')
}

function onPreview(quiz: Quiz) {
  previewQuiz.value = quiz
}

function exitPreview() {
  previewQuiz.value = null
}

onMounted(async () => {
  // Initialize quiz subscription (this will automatically update quizzes)
  const initialQuizzes = await quizService.getAllQuizzes()
  quizzes.value = initialQuizzes
  // Fetch initial results
  await userResultStore.fetchAllResults()
  // Wait for auth to be ready before fetching users
  if (showUserManagement.value) {
    if (authReady.value && firebaseUser.value) {
      fetchUsers()
    }
  }
})
watch([showUserManagement, authReady, firebaseUser], ([show, ready, user]) => {
  if (show && ready && user) fetchUsers()
})

// Chart rendering logic
watch([showAnalytics, quizzes, results], () => {
  if (showAnalytics.value) {
    nextTick(() => {
      quizzes.value.forEach((quiz: Quiz) => {
        const ctx = document.getElementById('chart-' + quiz.id) as HTMLCanvasElement
        if (ctx) {
          const existing = Chart.getChart(ctx)
          if (existing) existing.destroy()
          const quizResults = results.value.filter((r: UserResult) => r.quizId === quiz.id)
          const bins = Array(11).fill(0)
          quizResults.forEach((r: UserResult) => {
            const idx = Math.round((r.score / quiz.questions.length) * 10)
            bins[Math.min(idx, 10)]++
          })
          chartInstances[quiz.id] = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: Array.from({ length: 11 }, (_, i) => `${i * 10}%`),
              datasets: [{ label: 'Attempts', data: bins, backgroundColor: '#2563eb' }],
            },
            options: { responsive: false, plugins: { legend: { display: false } } },
          })
        }
        // Per-question correct % chart
        const ctxQ = document.getElementById('qchart-' + quiz.id) as HTMLCanvasElement
        if (ctxQ) {
          const existingQ = Chart.getChart(ctxQ)
          if (existingQ) existingQ.destroy()
          const labels = quiz.questions.map((q, i) => `Q${i + 1}`)
          const data = quiz.questions.map(q => questionCorrectPct(quiz.id, q.id))
          chartInstances['q' + quiz.id] = new Chart(ctxQ, {
            type: 'bar',
            data: {
              labels,
              datasets: [{ label: '% Correct', data, backgroundColor: '#059669' }],
            },
            options: {
              responsive: false,
              plugins: { legend: { display: false } },
              scales: { y: { min: 0, max: 100 } },
            },
          })
        }
      })
    })
  } else {
    destroyAllCharts()
  }
})
</script>
