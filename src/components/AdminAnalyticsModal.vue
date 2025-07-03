<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
    <div
      class="bg-white/95 dark:bg-gray-800/95 p-8 rounded-2xl shadow-2xl max-w-2xl w-full relative overflow-auto border border-gray-200 dark:border-gray-700"
    >
      <button
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full transition"
        @click="$emit('close')"
      >
        &times;
      </button>
      <h2 class="text-2xl font-extrabold mb-6 text-blue-700 dark:text-blue-300 text-center">
        Quiz Analytics
      </h2>
      <div
        v-if="currentQuiz"
        class="mb-10 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-700"
      >
        <div class="font-bold mb-2 text-lg text-purple-700 dark:text-purple-300">
          {{ currentQuiz.title }}
        </div>
        <div class="text-sm mb-2">
          Attempts: <span class="font-semibold">{{ attempts(currentQuiz.id) }}</span
          >, Average Score: <span class="font-semibold">{{ avgScore(currentQuiz.id) }}</span
          >, Avg. Time: <span class="font-semibold">{{ avgTime(currentQuiz.id) }}</span>
        </div>
        <canvas :id="'chart-' + currentQuiz.id" height="120" class="mb-4"></canvas>
        <div v-if="currentQuiz.questions.length" class="mt-4">
          <h4 class="font-semibold mb-2 text-sm">Per-Question Stats</h4>
          <canvas :id="'qchart-' + currentQuiz.id" height="80" class="mb-2"></canvas>
          <ul class="text-xs space-y-1 mt-2">
            <li v-for="(q, qidx) in paginatedQuestions" :key="q.id" class="w-full">
              <span class="font-bold">Q{{ questionPage * QUESTIONS_PER_PAGE + qidx + 1 }}:</span>
              {{ q.content }} —
              <span
                >Correct:
                <span class="text-green-600 font-semibold"
                  >{{ questionCorrectPct(currentQuiz.id, q.id) }}%</span
                ></span
              >
              <span v-if="mostMissedOption(currentQuiz.id, q.id)"
                >, Most Missed:
                <span class="text-red-600 font-semibold">{{
                  mostMissedOption(currentQuiz.id, q.id)
                }}</span></span
              >
            </li>
          </ul>
          <div v-if="totalQuestionPages > 1" class="flex justify-center items-center gap-2 mt-2">
            <button
              class="px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50"
              :disabled="questionPage === 0"
              @click="goToPrevQuestions"
            >
              Previous 5
            </button>
            <span class="text-xs text-gray-500">
              {{ questionPage * QUESTIONS_PER_PAGE + 1 }}–{{
                Math.min((questionPage + 1) * QUESTIONS_PER_PAGE, currentQuiz.questions.length)
              }}
              of {{ currentQuiz.questions.length }}
            </span>
            <button
              class="px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50"
              :disabled="questionPage === totalQuestionPages - 1"
              @click="goToNextQuestions"
            >
              Next 5
            </button>
          </div>
        </div>
        <div class="flex justify-between items-center mt-6">
          <button
            class="px-4 py-2 rounded shadow transition"
            :class="[
              currentPage === 0
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400',
            ]"
            :disabled="currentPage === 0"
            @click="goToPrev"
          >
            Previous
          </button>
          <span class="text-sm text-gray-500">
            Quiz {{ currentPage + 1 }} of {{ totalPages }}
          </span>
          <button
            class="px-4 py-2 rounded shadow transition"
            :class="[
              currentPage === totalPages - 1
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400',
            ]"
            :disabled="currentPage === totalPages - 1"
            @click="goToNext"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { toRefs } from 'vue'
import type { Quiz } from '../types/quiz'
import type { UserResult } from '../types/userResult'
import Chart from 'chart.js/auto'
import { useQuizAnalytics } from '../composables/useQuizAnalytics'

const props = defineProps<{
  quizzes: Quiz[]
  results: UserResult[]
  show: boolean
}>()

defineEmits<{
  close: []
}>()

const { quizzes, results } = toRefs(props)
const { attempts, avgScore, avgTime, questionCorrectPct, mostMissedOption } = useQuizAnalytics(
  quizzes.value,
  results.value
)

const currentPage = ref(0)
const totalPages = computed(() => quizzes.value.length)
const currentQuiz = computed(() => quizzes.value[currentPage.value] || null)

const QUESTIONS_PER_PAGE = 5
const questionPage = ref(0)
const totalQuestionPages = computed(() =>
  currentQuiz.value ? Math.ceil(currentQuiz.value.questions.length / QUESTIONS_PER_PAGE) : 1
)
const paginatedQuestions = computed(() => {
  if (!currentQuiz.value) return []
  const start = questionPage.value * QUESTIONS_PER_PAGE
  return currentQuiz.value.questions.slice(start, start + QUESTIONS_PER_PAGE)
})
function goToPrev() {
  if (currentPage.value > 0) currentPage.value--
}
function goToNext() {
  if (currentPage.value < totalPages.value - 1) currentPage.value++
}
function goToPrevQuestions() {
  if (questionPage.value > 0) questionPage.value--
}
function goToNextQuestions() {
  if (questionPage.value < totalQuestionPages.value - 1) questionPage.value++
}
watch(currentPage, () => {
  questionPage.value = 0
})

// Chart rendering and destruction logic
const chartInstances: Record<string, Chart> = {}
function destroyAllCharts() {
  Object.values(chartInstances).forEach(chart => chart?.destroy())
  Object.keys(chartInstances).forEach(key => delete chartInstances[key])
}
function renderCharts() {
  destroyAllCharts()
  if (!currentQuiz.value) return
  const quiz = currentQuiz.value
  const ctx = document.getElementById('chart-' + quiz.id) as HTMLCanvasElement
  if (ctx) {
    const existing = Chart.getChart(ctx)
    if (existing) existing.destroy()
    const quizResults = results.value.filter(r => r.quizId === quiz.id)
    const bins = Array(11).fill(0)
    quizResults.forEach(r => {
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
}

onMounted(() => {
  if (props.show) nextTick(renderCharts)
})
watch(
  () => props.show,
  val => {
    if (val) nextTick(renderCharts)
    if (!val) destroyAllCharts()
  }
)
watch([quizzes, results, currentPage], () => {
  if (props.show) nextTick(renderCharts)
})
</script>
