<template>
  <div v-if="currentQuiz" class="max-w-2xl mx-auto">
    <div
      v-if="preview"
      class="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg text-center font-bold border border-yellow-300 shadow"
    >
      Preview Mode – Results will not be saved
    </div>
    <h2 class="text-xl font-bold mb-4">{{ currentQuiz.title }}</h2>
    <div class="mb-2 text-gray-500">{{ currentQuiz.description }}</div>
    <div class="mb-4 text-xs">
      <span
        v-for="tag in currentQuiz.tags"
        :key="tag"
        class="inline-block bg-blue-100 text-blue-800 rounded px-2 py-0.5 mr-1"
        >{{ tag }}</span
      >
    </div>
    <transition name="fade-slide" mode="out-in">
      <div v-if="!showReview" :key="currentIndex" class="quiz-question">
        <div class="flex items-center justify-between mb-2">
          <div class="font-semibold">
            Question {{ currentIndex + 1 }} of {{ currentQuiz.questions.length }}
          </div>
          <div v-if="timerEnabled" class="text-sm font-mono">
            ⏰ {{ minutes }}:{{ seconds < 10 ? '0' + seconds : seconds }}
          </div>
        </div>
        <div class="w-full h-2 bg-gray-200 rounded mb-4">
          <div
            class="h-2 bg-blue-500 rounded transition-all duration-500"
            :style="{ width: progress + '%' }"
          ></div>
        </div>
        <div class="mb-4">{{ currentQuestion.content }}</div>
        <div v-if="!isCurrentAnswered" class="mb-2 text-red-600 font-semibold">
          Please select at least one answer to continue.
        </div>
        <div v-if="currentQuestion.type === 'multiple-choice'">
          <div v-for="opt in currentQuestion.options" :key="opt" class="mb-2">
            <label
              class="inline-flex items-center cursor-pointer"
              :tabindex="0"
              :aria-label="'Option ' + opt"
              @keydown.enter.prevent="selectRadio(opt)"
            >
              <input
                v-model="answers[currentQuestion.id]"
                type="radio"
                :name="'q' + currentQuestion.id"
                :value="opt"
                :aria-checked="answers[currentQuestion.id] === opt"
              />
              <span
                class="ml-2"
                :class="{ 'ring-2 ring-blue-400': answers[currentQuestion.id] === opt }"
                >{{ opt }}</span
              >
            </label>
          </div>
        </div>
        <div v-else-if="currentQuestion.type === 'multiple-answer'">
          <div v-for="opt in currentQuestion.options" :key="opt" class="mb-2">
            <label
              class="inline-flex items-center cursor-pointer"
              :tabindex="0"
              :aria-label="'Option ' + opt"
              @keydown.enter.prevent="toggleCheckbox(opt)"
            >
              <input
                v-model="answers[currentQuestion.id]"
                type="checkbox"
                :value="opt"
                :aria-checked="
                  Array.isArray(answers[currentQuestion.id]) &&
                  answers[currentQuestion.id].includes(opt)
                "
              />
              <span
                class="ml-2"
                :class="{
                  'ring-2 ring-blue-400':
                    Array.isArray(answers[currentQuestion.id]) &&
                    answers[currentQuestion.id].includes(opt),
                }"
                >{{ opt }}</span
              >
            </label>
          </div>
        </div>
        <div v-else-if="currentQuestion.type === 'short-text'">
          <input
            v-model="answers[currentQuestion.id]"
            type="text"
            class="input"
            :aria-label="'Short answer'"
          />
        </div>
        <div class="flex flex-wrap gap-2 mt-6">
          <button
            v-if="currentIndex > 0"
            class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
            :tabindex="0"
            @click="prev"
          >
            Previous
          </button>
          <button
            v-if="currentIndex < currentQuiz.questions.length - 1"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            :tabindex="0"
            :disabled="!isCurrentAnswered"
            @click="next"
          >
            Next
          </button>
          <button
            v-else
            class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            :disabled="!allAnswered"
            :tabindex="0"
            @click="confirmSubmit"
          >
            Submit
          </button>
        </div>
        <div
          v-if="showConfirm"
          class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
        >
          <div class="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-xs w-full">
            <div class="mb-4 text-lg font-semibold">Submit Quiz?</div>
            <div class="mb-4 text-sm">
              You have unanswered questions. Are you sure you want to submit?
            </div>
            <div class="flex gap-2 justify-end">
              <button
                class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded"
                @click="showConfirm = false"
              >
                Cancel
              </button>
              <button class="px-4 py-2 bg-green-600 text-white rounded" @click="submit">
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="mt-8">
        <h3 class="text-lg font-bold mb-4">Review Answers</h3>
        <div class="w-full max-w-3xl mx-auto">
          <ul class="space-y-4">
            <li
              v-for="(q, idx) in currentQuiz.questions"
              :key="q.id"
              class="bg-gray-50 dark:bg-gray-900 p-4 rounded shadow w-full"
            >
              <div class="flex justify-between items-center mb-1">
                <div class="font-semibold">Q{{ idx + 1 }}: {{ q.content }}</div>
                <div class="text-xs font-mono" :class="scoreClass(perQuestionScores[idx], q)">
                  Score: {{ perQuestionScores[idx] }}
                </div>
              </div>
              <div v-if="q.type !== 'short-text'">
                <div v-for="opt in q.options" :key="opt" class="ml-4 text-sm">
                  <span :class="optionClass(q, opt)">{{ opt }}</span>
                  <span v-if="isSelected(q, opt)"> (Your answer)</span>
                  <span v-if="q.correctAnswers.includes(opt)"> (Correct)</span>
                </div>
              </div>
              <div v-else class="ml-4 text-sm">
                <span :class="shortTextClass(q)">{{ answers[q.id] }}</span>
                <span v-if="isShortTextCorrect(q)"> (Correct)</span>
              </div>
              <div v-if="q.explanation" class="ml-4 text-xs text-green-700 mt-2">
                Explanation: {{ q.explanation }}
              </div>
              <div v-if="partialExplanations[idx]" class="ml-4 text-xs text-yellow-700 mt-2">
                {{ partialExplanations[idx] }}
              </div>
            </li>
          </ul>
        </div>
        <div class="flex flex-wrap gap-2 mt-6">
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            @click="restart"
          >
            Restart Quiz
          </button>
          <button
            class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
            @click="$emit('submit', answers)"
          >
            Back to Quiz List
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { Quiz, Question } from '../types/quiz'
import { useUserResultStore } from '../store/userResult'
import { useAuthStore } from '../store/auth'
import { quizService } from '../services/quizService'
import { useQuizTimer } from '../composables/useQuizTimer'
import { useQuizScoring } from '../composables/useQuizScoring'
import { updateGamification } from '../composables/useGamification'
import { userService } from '../services/userService'
import { useAuth } from '../composables/useAuth'

const props = defineProps<{
  quiz: Quiz
  reviewAnswers?: Record<string, string | string[]>
  forceReview?: boolean
  preview?: boolean
}>()
defineEmits(['submit'])

const userResultStore = useUserResultStore()
const authStore = useAuthStore()
const { calculateQuestionScore, getPartialExplanation, getOptionClass } = useQuizScoring()
const { user } = useAuth()

// Add real-time quiz subscription and timer/tab protection
let unsubscribeQuiz: (() => void) | null = null
const currentQuiz = ref<Quiz>(props.quiz)

const currentIndex = ref(0)
const showReview = ref(false)
const showConfirm = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

if (props.forceReview) showReview.value = true

const answers = computed({
  get() {
    return props.forceReview && props.reviewAnswers ? props.reviewAnswers : _answers.value
  },
  set(val) {
    if (!props.forceReview) _answers.value = val
  },
})
const _answers = ref<Record<string, string | string[]>>({})

const timerEnabled = computed(() => !!props.quiz.timer && !props.preview)
const {
  timeLeft,
  minutes,
  seconds,
  start: startTimer,
  stop: stopTimer,
  reset: resetTimer,
} = useQuizTimer(props.quiz.timer || 0, () => {
  if (!showReview.value) submit()
})

// Prevent back navigation and detect tab switching for quiz integrity
function preventBack() {
  window.history.pushState(null, '', window.location.href)
  alert('Back navigation is disabled during the quiz.')
}

function handleVisibilityChange() {
  if (document.hidden) {
    alert('Please do not switch tabs or minimize during the quiz!')
  }
}

onMounted(() => {
  unsubscribeQuiz = quizService.subscribeToQuiz(props.quiz.id, updatedQuiz => {
    if (updatedQuiz) {
      currentQuiz.value = updatedQuiz
    }
  })

  if (timerEnabled.value) {
    startTimer()
  }

  window.history.pushState(null, '', window.location.href)
  window.addEventListener('popstate', preventBack)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  stopTimer()
  if (unsubscribeQuiz) unsubscribeQuiz()
  window.removeEventListener('popstate', preventBack)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

watch(
  () => props.quiz,
  () => {
    currentIndex.value = 0
    answers.value = {}
    showReview.value = false
    ensureAnswerArray()
    if (timerEnabled.value) {
      resetTimer()
      startTimer()
    }
  }
)

const currentQuestion = computed(() => currentQuiz.value.questions[currentIndex.value])
const progress = computed(
  () => ((currentIndex.value + 1) / currentQuiz.value.questions.length) * 100
)
const allAnswered = computed(() =>
  currentQuiz.value.questions.every(
    q =>
      answers.value[q.id] !== undefined &&
      answers.value[q.id] !== '' &&
      (!Array.isArray(answers.value[q.id]) || answers.value[q.id].length > 0)
  )
)

const perQuestionScores = computed<number[]>(() =>
  currentQuiz.value.questions.map(q => calculateQuestionScore(q, answers.value[q.id]))
)

const partialExplanations = computed(() =>
  currentQuiz.value.questions.map(q => getPartialExplanation(q, answers.value[q.id]))
)

function scoreClass(score: number, q: Question) {
  if (q.type === 'multiple-answer' && score > 0 && score < 1) return 'text-yellow-600 font-bold'
  if (score >= 1) return 'text-green-700 font-bold'
  if (score == 0) return 'text-red-600 font-bold'
  return ''
}

function ensureAnswerArray() {
  if (
    currentQuestion.value.type === 'multiple-answer' &&
    !Array.isArray(answers.value[currentQuestion.value.id])
  ) {
    answers.value[currentQuestion.value.id] = []
  }
}

function next() {
  if (currentIndex.value < currentQuiz.value.questions.length - 1) {
    currentIndex.value++
    ensureAnswerArray()
  }
  focusFirstInput()
}

function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    ensureAnswerArray()
  }
  focusFirstInput()
}

function confirmSubmit() {
  if (!allAnswered.value) {
    showConfirm.value = true
  } else {
    submit()
  }
}

async function submit() {
  showReview.value = true
  showConfirm.value = false
  stopTimer()

  if (props.preview || props.forceReview) return

  saving.value = true
  error.value = null
  try {
    const totalScore = perQuestionScores.value.reduce((acc, score) => acc + score, 0)
    const maxScore = currentQuiz.value.questions.length
    const percentage = Math.round((totalScore / maxScore) * 100)

    const resultObj = {
      quizId: currentQuiz.value.id,
      userId: authStore.user?.uid || authStore.user?.id || '',
      answers: JSON.parse(JSON.stringify(answers.value)),
      score: totalScore,
      maxScore,
      percentage,
      completedAt: new Date().toISOString(),
      timeSpent: props.quiz.timer ? props.quiz.timer - timeLeft.value : undefined,
    }
    console.log('Attempting to add quiz result:', resultObj)
    await userResultStore.addResult(resultObj)
    console.log('Quiz result successfully added to Firestore.')
    await userResultStore.fetchAllResults()

    if (authStore.user?.uid || authStore.user?.id) {
      await updateGamification({
        userId: authStore.user.uid || authStore.user.id,
        score: totalScore,
        completedAt: new Date().toISOString(),
      })
      // Fetch updated user data and update local store
      const updatedUser = await userService.getUserById(authStore.user.uid || authStore.user.id)
      console.log('Fetched updated user after quiz:', updatedUser)
      if (updatedUser) {
        authStore.user = updatedUser
        user.value = updatedUser
      }
    }
  } catch (err) {
    error.value = (err as Error).message
    console.error('Failed to save quiz results:', err)
  } finally {
    saving.value = false
  }
}

function restart() {
  currentIndex.value = 0
  answers.value = {}
  showReview.value = false
  ensureAnswerArray()
  if (timerEnabled.value) {
    resetTimer()
    startTimer()
  }
  nextTick(focusFirstInput)
}

function selectRadio(opt: string) {
  answers.value[currentQuestion.value.id] = opt
}

function toggleCheckbox(opt: string) {
  let arr = answers.value[currentQuestion.value.id]
  if (!Array.isArray(arr)) arr = []
  if (arr.includes(opt)) {
    answers.value[currentQuestion.value.id] = arr.filter((o: string) => o !== opt)
  } else {
    answers.value[currentQuestion.value.id] = [...arr, opt]
  }
}

function focusFirstInput() {
  nextTick(() => {
    const el = document.querySelector(
      '.quiz-question input, .quiz-question textarea'
    ) as HTMLElement
    if (el) el.focus()
  })
}

function isSelected(q: Question, opt: string) {
  if (q.type === 'multiple-answer') {
    return Array.isArray(answers.value[q.id]) && answers.value[q.id].includes(opt)
  }
  return answers.value[q.id] === opt
}

function optionClass(q: Question, opt: string) {
  return getOptionClass(q, opt, isSelected(q, opt), showReview.value)
}

function shortTextClass(q: Question) {
  if (showReview.value) {
    if (isShortTextCorrect(q)) return 'text-green-700 font-bold'
    else return 'text-red-600 font-bold'
  }
  return ''
}

function isShortTextCorrect(q: Question) {
  const ans = typeof answers.value[q.id] === 'string' ? answers.value[q.id] : ''
  return calculateQuestionScore(q, ans) === 1
}

watch(currentQuestion, newQ => {
  const ans = answers.value[newQ.id]
  if (newQ.type === 'multiple-choice' && Array.isArray(ans)) {
    answers.value[newQ.id] = ''
  } else if (newQ.type === 'multiple-answer' && !Array.isArray(ans)) {
    answers.value[newQ.id] = []
  }
})

// Add a computed property to check if the current question is answered
const isCurrentAnswered = computed(() => {
  const ans = answers.value[currentQuestion.value.id]
  if (currentQuestion.value.type === 'multiple-answer') {
    return Array.isArray(ans) && ans.length > 0
  }
  return ans !== undefined && ans !== ''
})
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700;
}
.fade-slide-enter-active,
.fade-slide-leave-active {
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
