<template>
  <div>
    <h3 class="font-semibold mb-2">Questions</h3>
    <div v-if="questions.length === 0" class="text-gray-500 mb-4">No questions yet.</div>
    <div class="w-full max-w-3xl mx-auto">
      <ul class="space-y-4 mb-4">
        <li
          v-for="(q, idx) in questions"
          :key="q.id"
          class="bg-gray-50 dark:bg-gray-900 p-4 rounded shadow w-full"
        >
          <div class="flex justify-between items-center mb-2">
            <span class="font-bold">Q{{ idx + 1 }}: {{ q.content }}</span>
            <button
              class="text-red-500 hover:underline"
              :disabled="disabled"
              @click="removeQuestion(q.id)"
            >
              Remove
            </button>
          </div>
          <div class="text-xs text-gray-500 mb-1">Type: {{ q.type }}</div>
          <div v-if="q.type !== 'short-text'">
            <div v-for="(opt, oidx) in q.options" :key="oidx" class="ml-4 text-sm">- {{ opt }}</div>
          </div>
          <div v-if="q.explanation" class="ml-4 text-xs text-green-700">
            Explanation: {{ q.explanation }}
          </div>
          <div v-if="q._error" class="text-red-500 text-xs mt-1">{{ q._error }}</div>
        </li>
      </ul>
    </div>
    <form class="space-y-2 bg-gray-100 dark:bg-gray-800 p-4 rounded" @submit.prevent="addQuestion">
      <div>
        <label class="block font-semibold mb-1">Type</label>
        <select v-model="newQ.type" class="input" required :disabled="disabled">
          <option value="multiple-choice">Multiple Choice</option>
          <option value="multiple-answer">Multiple Answer</option>
          <option value="short-text">Short Text</option>
        </select>
      </div>
      <div>
        <label class="block font-semibold mb-1">Question</label>
        <input
          v-model="newQ.content"
          type="text"
          class="input"
          :class="{ 'border-red-500': newErrors.content || newErrors.duplicate }"
          required
          :disabled="disabled"
        />
        <div v-if="newErrors.content" class="text-red-500 text-xs mt-1">
          Question content is required.
        </div>
        <div v-if="newErrors.duplicate" class="text-red-500 text-xs mt-1">
          Duplicate question content is not allowed.
        </div>
      </div>
      <div v-if="newQ.type !== 'short-text'">
        <label class="block font-semibold mb-1">Options (comma separated)</label>
        <input
          v-model="optionsInput"
          type="text"
          class="input"
          :class="{ 'border-red-500': newErrors.options }"
          :disabled="disabled"
        />
        <div v-if="newErrors.options" class="text-red-500 text-xs mt-1">
          At least two unique options are required.
        </div>
      </div>
      <div>
        <label class="block font-semibold mb-1">Correct Answer(s) (comma separated)</label>
        <input
          v-model="answersInput"
          type="text"
          class="input"
          :class="{ 'border-red-500': newErrors.correctAnswers }"
          :disabled="disabled"
        />
        <div v-if="newErrors.correctAnswers" class="text-red-500 text-xs mt-1">
          At least one correct answer is required.
        </div>
      </div>
      <div>
        <label class="block font-semibold mb-1">Explanation (optional)</label>
        <input
          v-model="newQ.explanation"
          type="text"
          class="input"
          :class="{ 'border-red-500': newErrors.explanation }"
          :disabled="disabled"
        />
        <div v-if="newErrors.explanation" class="text-red-500 text-xs mt-1">
          Explanation is required if there are incorrect options.
        </div>
      </div>
      <button
        type="submit"
        class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!canAdd || disabled"
      >
        Add Question
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Question, QuestionType } from '../types/quiz'
import { useQuestionValidation } from '../composables/useQuestionValidation'

const props = defineProps<{
  modelValue: Question[]
  disabled?: boolean
}>()
const emit = defineEmits(['update:modelValue'])

const questions = ref<Question[]>(props.modelValue || [])

watch(
  () => props.modelValue,
  val => {
    questions.value = val || []
  }
)

function removeQuestion(id: string) {
  if (props.disabled) return
  questions.value = questions.value.filter(q => q.id !== id)
  emit('update:modelValue', questions.value)
}

const {
  newQ,
  optionsInput,
  answersInput,
  newErrors,
  canAdd,
  validateNew,
  resetNewQ,
  parseOptions,
  parseCorrectAnswers,
} = useQuestionValidation(questions.value)

function addQuestion() {
  if (props.disabled || !validateNew()) return
  const id = Date.now().toString() + Math.random().toString(36).slice(2)
  const options = parseOptions()
  const correctAnswers = parseCorrectAnswers()
  questions.value.push({
    id,
    type: newQ.value.type as QuestionType,
    content: newQ.value.content!,
    options,
    correctAnswers,
    explanation: newQ.value.explanation || '',
    _error: undefined,
  })
  emit('update:modelValue', questions.value)
  resetNewQ()
}

// Per-question validation for the list
watch(
  questions,
  val => {
    val.forEach(q => {
      let error = ''
      if (!q.content) error = 'Question content is required.'
      else if (
        val.filter(qq => qq.content.trim().toLowerCase() === q.content.trim().toLowerCase())
          .length > 1
      )
        error = 'Duplicate question content is not allowed.'
      else if (q.type !== 'short-text') {
        if (!q.options || q.options.length < 2) error = 'At least two options are required.'
        else if (new Set(q.options).size !== q.options.length) error = 'Options must be unique.'
        const incorrectOpts = (q.options ?? []).filter(opt => !q.correctAnswers.includes(opt))
        if (incorrectOpts.length > 0 && !q.explanation)
          error = 'Explanation is required if there are incorrect options.'
      }
      if (!q.correctAnswers || q.correctAnswers.length < 1)
        error = 'At least one correct answer is required.'
      q._error = error
    })
  },
  { immediate: true, deep: true }
)
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
