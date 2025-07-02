<template>
  <div
    class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl mt-12 border border-gray-200 dark:border-gray-700"
  >
    <h1 class="text-3xl font-extrabold mb-8 text-center text-purple-700 dark:text-purple-300">
      Quiz Analytics
    </h1>
    <div class="space-y-6">
      <div
        v-for="quiz in quizzes"
        :key="quiz.id"
        class="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-700"
      >
        <div class="font-bold mb-4 text-xl text-purple-700 dark:text-purple-300">
          {{ quiz.title }}
        </div>
        <div class="text-sm mb-4">
          Attempts: <span class="font-semibold">{{ attempts(quiz.id) }}</span
          >, Average Score: <span class="font-semibold">{{ avgScore(quiz.id) }}</span
          >, Avg. Time: <span class="font-semibold">{{ avgTime(quiz.id) }}</span>
        </div>
        <canvas :id="'chart-' + quiz.id" height="120" class="mb-4"></canvas>
        <div v-if="quiz.questions.length" class="mt-4">
          <h4 class="font-semibold mb-2 text-sm">Per-Question Stats</h4>
          <canvas :id="'qchart-' + quiz.id" height="80" class="mb-2"></canvas>
          <ul class="text-xs space-y-1 mt-2">
            <li v-for="(q, qidx) in quiz.questions" :key="q.id">
              <span class="font-bold">Q{{ qidx + 1 }}:</span> {{ q.content }} —
              <span
                >Correct:
                <span class="text-green-600 font-semibold"
                  >{{ questionCorrectPct(quiz.id, q.id) }}%</span
                ></span
              >
              <span v-if="mostMissedOption(quiz.id, q.id)"
                >, Most Missed:
                <span class="text-red-600 font-semibold">{{
                  mostMissedOption(quiz.id, q.id)
                }}</span></span
              >
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick } from 'vue'
import { useQuizStore } from '../store/quiz'
import { useUserResultStore } from '../store/userResult'
import { storeToRefs } from 'pinia'
import { useQuizAnalytics } from '../composables/useQuizAnalytics'
import type { Chart } from 'chart.js'
import type { Quiz } from '../types/quiz'
import type { UserResult } from '../types/userResult'

const quizStore = useQuizStore()
const userResultStore = useUserResultStore()
const { quizzes } = storeToRefs(quizStore)
const { results } = storeToRefs(userResultStore)

const { attempts, avgScore, avgTime, questionCorrectPct, mostMissedOption } = useQuizAnalytics(
  quizzes.value,
  results.value
)

// Chart rendering logic
const chartInstances: Record<string, Chart> = {}
function renderCharts() {
  quizzes.value.forEach((quiz: Quiz) => {
    const ctx = document.getElementById('chart-' + quiz.id) as HTMLCanvasElement
    if (ctx) {
      if (chartInstances[quiz.id]) chartInstances[quiz.id].destroy()
      const quizResults = results.value.filter((r: UserResult) => r.quizId === quiz.id)
      const bins = Array(11).fill(0)
      quizResults.forEach((r: UserResult) => {
        const idx = Math.round((r.score / quiz.questions.length) * 10)
        bins[Math.min(idx, 10)]++
      })
      import('chart.js/auto').then(({ default: Chart }) => {
        chartInstances[quiz.id] = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: Array.from({ length: 11 }, (_, i) => `${i * 10}%`),
            datasets: [{ label: 'Attempts', data: bins, backgroundColor: '#2563eb' }],
          },
          options: { responsive: false, plugins: { legend: { display: false } } },
        })
      })
    }
    // Per-question correct % chart
    const ctxQ = document.getElementById('qchart-' + quiz.id) as HTMLCanvasElement
    if (ctxQ) {
      if (chartInstances['q' + quiz.id]) chartInstances['q' + quiz.id].destroy()
      const labels = quiz.questions.map((q, i: number) => `Q${i + 1}`)
      const data = quiz.questions.map(q => questionCorrectPct(quiz.id, q.id))
      import('chart.js/auto').then(({ default: Chart }) => {
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
      })
    }
  })
}

onMounted(() => {
  nextTick(renderCharts)
})
</script>
