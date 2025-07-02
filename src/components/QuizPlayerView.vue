<template>
  <div v-if="quiz" class="max-w-2xl mx-auto">
    <h2 class="text-xl font-bold mb-4">{{ quiz.title }}</h2>
    <div class="mb-2 text-gray-500">{{ quiz.description }}</div>
    <div class="mb-4 text-xs">
      <span v-for="tag in quiz.tags" :key="tag" class="inline-block bg-blue-100 text-blue-800 rounded px-2 py-0.5 mr-1">{{ tag }}</span>
    </div>
    <transition name="fade-slide" mode="out-in">
      <div v-if="!showReview" :key="currentIndex" class="quiz-question">
        <div class="flex items-center justify-between mb-2">
          <div class="font-semibold">Question {{ currentIndex + 1 }} of {{ quiz.questions.length }}</div>
          <div v-if="timerEnabled" class="text-sm font-mono">
            ⏰ {{ minutes }}:{{ seconds < 10 ? '0' + seconds : seconds }}
          </div>
        </div>
        <div class="w-full h-2 bg-gray-200 rounded mb-4">
          <div class="h-2 bg-blue-500 rounded transition-all duration-500" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="mb-4">{{ currentQuestion.content }}</div>
        <div v-if="currentQuestion.type === 'multiple-choice'">
          <div v-for="opt in currentQuestion.options" :key="opt" class="mb-2">
            <label class="inline-flex items-center cursor-pointer" :tabindex="0" :aria-label="'Option ' + opt" @keydown.enter.prevent="selectRadio(opt)">
              <input type="radio" :name="'q' + currentQuestion.id" :value="opt" v-model="answers[currentQuestion.id]" :aria-checked="answers[currentQuestion.id] === opt" />
              <span class="ml-2" :class="{'ring-2 ring-blue-400': answers[currentQuestion.id] === opt}">{{ opt }}</span>
            </label>
          </div>
        </div>
        <div v-else-if="currentQuestion.type === 'multiple-answer'">
          <div v-for="opt in currentQuestion.options" :key="opt" class="mb-2">
            <label class="inline-flex items-center cursor-pointer" :tabindex="0" :aria-label="'Option ' + opt" @keydown.enter.prevent="toggleCheckbox(opt)">
              <input type="checkbox" :value="opt" v-model="answers[currentQuestion.id]" :aria-checked="Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes(opt)" />
              <span class="ml-2" :class="{'ring-2 ring-blue-400': Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes(opt)}">{{ opt }}</span>
            </label>
          </div>
        </div>
        <div v-else-if="currentQuestion.type === 'short-text'">
          <input v-model="answers[currentQuestion.id]" type="text" class="input" :aria-label="'Short answer'" />
        </div>
        <div class="flex flex-wrap gap-2 mt-6">
          <button v-if="currentIndex > 0" @click="prev" class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600" :tabindex="0">Previous</button>
          <button v-if="currentIndex < quiz.questions.length - 1" @click="next" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" :tabindex="0">Next</button>
          <button v-else @click="confirmSubmit" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" :disabled="!allAnswered" :tabindex="0">Submit</button>
        </div>
        <div v-if="showConfirm" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div class="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-xs w-full">
            <div class="mb-4 text-lg font-semibold">Submit Quiz?</div>
            <div class="mb-4 text-sm">You have unanswered questions. Are you sure you want to submit?</div>
            <div class="flex gap-2 justify-end">
              <button class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded" @click="showConfirm = false">Cancel</button>
              <button class="px-4 py-2 bg-green-600 text-white rounded" @click="submit">Submit Anyway</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="mt-8">
        <h3 class="text-lg font-bold mb-4">Review Answers</h3>
        <ul class="space-y-4">
          <li v-for="(q, idx) in quiz.questions" :key="q.id" class="bg-gray-50 dark:bg-gray-900 p-4 rounded shadow">
            <div class="flex justify-between items-center mb-1">
              <div class="font-semibold">Q{{ idx + 1 }}: {{ q.content }}</div>
              <div class="text-xs font-mono" :class="scoreClass(perQuestionScores[idx], q)">
                Score: {{ perQuestionScores[idx] }}
              </div>
            </div>
            <div v-if="q.type !== 'short-text'">
              <div v-for="opt in q.options" :key="opt" class="ml-4 text-sm">
                <span :class="optionClass(q, opt, idx)">{{ opt }}</span>
                <span v-if="isSelected(q, opt)"> (Your answer)</span>
                <span v-if="q.correctAnswers.includes(opt)"> (Correct)</span>
              </div>
            </div>
            <div v-else class="ml-4 text-sm">
              <span :class="shortTextClass(q, idx)">{{ answers[q.id] }}</span>
              <span v-if="isShortTextCorrect(q, idx)"> (Correct)</span>
            </div>
            <div v-if="q.explanation" class="ml-4 text-xs text-green-700 mt-2">Explanation: {{ q.explanation }}</div>
            <div v-if="partialExplanations[idx]" class="ml-4 text-xs text-yellow-700 mt-2">{{ partialExplanations[idx] }}</div>
          </li>
        </ul>
        <div class="flex flex-wrap gap-2 mt-6">
          <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" @click="restart">Restart Quiz</button>
          <button class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600" @click="$emit('submit', answers)">Back to Quiz List</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { Quiz, Question } from '../types/quiz'

const props = defineProps<{ quiz: Quiz, reviewAnswers?: Record<string, any>, forceReview?: boolean }>()
const emit = defineEmits(['submit'])

const currentIndex = ref(0)
const showReview = ref(false)
const showConfirm = ref(false)

// Use review mode if forceReview is true
if (props.forceReview) showReview.value = true

const answers = computed({
  get() {
    return props.forceReview && props.reviewAnswers ? props.reviewAnswers : _answers.value
  },
  set(val) {
    if (!props.forceReview) _answers.value = val
  }
})
const _answers = ref<Record<string, any>>({})

// Timer
const timerEnabled = computed(() => !!props.quiz.timer)
const timeLeft = ref(props.quiz.timer || 0)
let timerInterval: any = null
const minutes = computed(() => Math.floor(timeLeft.value / 60))
const seconds = computed(() => timeLeft.value % 60)

onMounted(() => {
  if (timerEnabled.value) {
    timeLeft.value = props.quiz.timer || 0
    timerInterval = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--
      } else {
        clearInterval(timerInterval)
        if (!showReview.value) submit()
      }
    }, 1000)
  }
})
onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval)
})

watch(() => props.quiz, () => {
  currentIndex.value = 0
  answers.value = {}
  showReview.value = false
  if (timerEnabled.value) {
    timeLeft.value = props.quiz.timer || 0
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--
      } else {
        clearInterval(timerInterval)
        if (!showReview.value) submit()
      }
    }, 1000)
  }
})

const currentQuestion = computed(() => props.quiz.questions[currentIndex.value])
const progress = computed(() => ((currentIndex.value + 1) / props.quiz.questions.length) * 100)
const allAnswered = computed(() => props.quiz.questions.every(q => answers.value[q.id] !== undefined && answers.value[q.id] !== '' && (!Array.isArray(answers.value[q.id]) || answers.value[q.id].length > 0)))

// Per-question scoring
const perQuestionScores = computed(() => props.quiz.questions.map((q, idx) => {
  if (q.type === 'multiple-choice') {
    return answers.value[q.id] === q.correctAnswers[0] ? 1 : 0
  } else if (q.type === 'multiple-answer') {
    const userAns = Array.isArray(answers.value[q.id]) ? answers.value[q.id] : []
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
    return Number.isInteger(partial) ? partial : partial.toFixed(2)
  } else if (q.type === 'short-text') {
    return ((answers.value[q.id] || '').trim().toLowerCase() === (q.correctAnswers[0] || '').trim().toLowerCase()) ? 1 : 0
  }
  return 0
}))

// Partial credit explanations
const partialExplanations = computed(() => props.quiz.questions.map((q, idx) => {
  if (q.type === 'multiple-answer') {
    const userAns = Array.isArray(answers.value[q.id]) ? answers.value[q.id] : []
    const correct = q.correctAnswers
    const missed = correct.filter(a => !userAns.includes(a))
    const incorrect = userAns.filter(a => !correct.includes(a))
    if (missed.length === 0 && incorrect.length === 0) return ''
    let msg = ''
    if (missed.length > 0) msg += `Missed correct: ${missed.join(', ')}. `
    if (incorrect.length > 0) msg += `Incorrectly selected: ${incorrect.join(', ')}.`
    return msg.trim()
  }
  return ''
}))

function scoreClass(score, q) {
  if (q.type === 'multiple-answer' && score > 0 && score < 1) return 'text-yellow-600 font-bold'
  if (score >= 1) return 'text-green-700 font-bold'
  if (score == 0) return 'text-red-600 font-bold'
  return ''
}

function next() {
  if (currentIndex.value < props.quiz.questions.length - 1) currentIndex.value++
  focusFirstInput()
}
function prev() {
  if (currentIndex.value > 0) currentIndex.value--
  focusFirstInput()
}
function confirmSubmit() {
  if (!allAnswered.value) {
    showConfirm.value = true
  } else {
    submit()
  }
}
function submit() {
  showReview.value = true
  showConfirm.value = false
  if (timerInterval) clearInterval(timerInterval)
}
function restart() {
  currentIndex.value = 0
  answers.value = {}
  showReview.value = false
  if (timerEnabled.value) {
    timeLeft.value = props.quiz.timer || 0
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--
      } else {
        clearInterval(timerInterval)
        if (!showReview.value) submit()
      }
    }, 1000)
  }
  nextTick(focusFirstInput)
}

// Keyboard navigation helpers
function selectRadio(opt: string) {
  answers.value[currentQuestion.value.id] = opt
}
function toggleCheckbox(opt: string) {
  const arr = answers.value[currentQuestion.value.id] || []
  if (arr.includes(opt)) {
    answers.value[currentQuestion.value.id] = arr.filter((o: string) => o !== opt)
  } else {
    answers.value[currentQuestion.value.id] = [...arr, opt]
  }
}
function focusFirstInput() {
  nextTick(() => {
    const el = document.querySelector('.quiz-question input, .quiz-question textarea') as HTMLElement
    if (el) el.focus()
  })
}

// Review helpers
function isSelected(q: Question, opt: string) {
  if (q.type === 'multiple-answer') {
    return Array.isArray(answers.value[q.id]) && answers.value[q.id].includes(opt)
  }
  return answers.value[q.id] === opt
}
function optionClass(q: Question, opt: string, idx: number) {
  if (showReview.value) {
    if (q.correctAnswers.includes(opt) && isSelected(q, opt)) return 'text-green-700 font-bold'
    if (!q.correctAnswers.includes(opt) && isSelected(q, opt)) return 'text-red-600 font-bold'
    if (q.correctAnswers.includes(opt)) return 'text-green-700'
  }
  return ''
}
function shortTextClass(q: Question, idx: number) {
  if (showReview.value) {
    if (isShortTextCorrect(q, idx)) return 'text-green-700 font-bold'
    else return 'text-red-600 font-bold'
  }
  return ''
}
function isShortTextCorrect(q: Question, idx: number) {
  return (answers.value[q.id] || '').trim().toLowerCase() === (q.correctAnswers[0] || '').trim().toLowerCase()
}
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700;
}
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-16px);
}
.quiz-question:focus-within {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
</style> 