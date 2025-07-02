<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
    <div class="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-2xl w-full relative overflow-auto">
      <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" @click="$emit('close')">&times;</button>
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
</template>

<script setup lang="ts">
import { onMounted, watch, nextTick } from 'vue'
import { toRefs } from 'vue'
import type { Quiz } from '../types/quiz'
import { useQuizAnalytics } from '../composables/useQuizAnalytics'

const props = defineProps<{
  quizzes: Quiz[],
  results: any[],
  show: boolean
}>()

const { quizzes, results } = toRefs(props)
const { attempts, avgScore, avgTime, questionCorrectPct, mostMissedOption } = useQuizAnalytics(quizzes.value, results.value)

// Chart rendering logic
let chartInstances: Record<string, any> = {}
function renderCharts() {
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
}

onMounted(() => {
  if (props.show) nextTick(renderCharts)
})
watch(() => props.show, (val) => { if (val) nextTick(renderCharts) })
watch([quizzes, results], () => { if (props.show) nextTick(renderCharts) })
</script> 