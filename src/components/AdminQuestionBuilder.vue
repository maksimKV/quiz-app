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
            <div class="flex gap-2">
              <button
                class="text-blue-500 hover:underline"
                :disabled="disabled"
                @click="openEditModal(q, idx)"
              >
                Edit
              </button>
              <button
                class="text-red-500 hover:underline"
                :disabled="disabled"
                @click="removeQuestion(q.id)"
              >
                Remove
              </button>
            </div>
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
        <div v-if="newErrors.correctAnswersMsg" class="text-red-500 text-xs mt-1">
          {{ newErrors.correctAnswersMsg }}
        </div>
      </div>
      <div>
        <label class="block font-semibold mb-1">Explanation (optional)</label>
        <input v-model="newQ.explanation" type="text" class="input" :disabled="disabled" />
      </div>
      <button
        type="button"
        class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!canAdd || disabled"
        @click="addQuestion"
      >
        Add Question
      </button>
      <div
        v-if="!canAdd && (newQ.content || optionsInput || answersInput)"
        class="text-red-500 text-xs mt-2"
      >
        Please fix the errors above to add the question.
      </div>
    </form>
    <!-- Edit Question Modal -->
    <Teleport to="body">
      <div
        v-if="editModalOpen"
        class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50"
      >
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-lg w-full relative">
          <button
            class="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl font-bold focus:outline-none"
            @click="closeEditModal"
          >
            &times;
          </button>
          <h3 class="text-xl font-bold mb-4">Edit Question</h3>
          <div class="space-y-2">
            <div>
              <label class="block font-semibold mb-1">Type</label>
              <select
                v-model="editQ.type"
                class="input"
                required
                :disabled="disabled"
                @keydown.enter.prevent
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="multiple-answer">Multiple Answer</option>
                <option value="short-text">Short Text</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold mb-1">Question</label>
              <input
                v-model="editQ.content"
                type="text"
                class="input"
                :class="{ 'border-red-500': editErrors.content || editErrors.duplicate }"
                required
                :disabled="disabled"
                @keydown.enter.prevent
              />
              <div v-if="editErrors.content" class="text-red-500 text-xs mt-1">
                Question content is required.
              </div>
              <div v-if="editErrors.duplicate" class="text-red-500 text-xs mt-1">
                Duplicate question content is not allowed.
              </div>
            </div>
            <div v-if="editQ.type !== 'short-text'">
              <label class="block font-semibold mb-1">Options (comma separated)</label>
              <input
                v-model="editOptionsInput"
                type="text"
                class="input"
                :class="{ 'border-red-500': editErrors.options }"
                :disabled="disabled"
                @keydown.enter.prevent
              />
              <div v-if="editErrors.options" class="text-red-500 text-xs mt-1">
                At least two unique options are required.
              </div>
            </div>
            <div>
              <label class="block font-semibold mb-1">Correct Answer(s) (comma separated)</label>
              <input
                v-model="editAnswersInput"
                type="text"
                class="input"
                :class="{ 'border-red-500': editErrors.correctAnswers }"
                :disabled="disabled"
                @keydown.enter.prevent
              />
              <div v-if="editErrors.correctAnswersMsg" class="text-red-500 text-xs mt-1">
                {{ editErrors.correctAnswersMsg }}
              </div>
            </div>
            <div>
              <label class="block font-semibold mb-1">Explanation (optional)</label>
              <input
                v-model="editQ.explanation"
                type="text"
                class="input"
                :disabled="disabled"
                @keydown.enter.prevent
              />
            </div>
            <div class="flex gap-2 mt-4">
              <button
                type="button"
                class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                :disabled="disabled"
                @click="saveEdit"
              >
                Save
              </button>
              <button
                type="button"
                class="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                @click="closeEditModal"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue'
import type { Question, QuestionType } from '../types/quiz'
import { useQuestionValidation } from '../composables/useQuestionValidation'

const props = defineProps<{
  modelValue: Question[]
  disabled?: boolean
}>()
const emit = defineEmits(['update:modelValue'])

const questions = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

function removeQuestion(id: string) {
  if (props.disabled) return
  questions.value = questions.value.filter(q => q.id !== id)
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

function normalizeQuestionContent(content: string): string {
  return content
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, '') // Remove all punctuation and symbols (Unicode-aware)
    .replace(/\s+/g, ' ')
    .trim()
}

function addQuestion() {
  if (props.disabled || !validateNew()) return
  const id = Date.now().toString() + Math.random().toString(36).slice(2)
  const options = parseOptions()
  const correctAnswers = parseCorrectAnswers()
  const newQuestion = {
    id,
    type: newQ.value.type as QuestionType,
    content: newQ.value.content!,
    options,
    correctAnswers,
    explanation: newQ.value.explanation || '',
    _error: undefined,
  }
  questions.value = [...questions.value, newQuestion]
  resetNewQ()
}

// Per-question validation for the list
watch(
  questions,
  (val: Question[]) => {
    val.forEach((q: Question) => {
      let error = ''
      if (!q.content) error = 'Question content is required.'
      else if (
        val.filter(
          (qq: Question) =>
            normalizeQuestionContent(qq.content || '') === normalizeQuestionContent(q.content || '')
        ).length > 1
      )
        error = 'Duplicate question content is not allowed.'
      else if (q.type !== 'short-text') {
        if (!q.options || q.options.length < 2) error = 'At least two options are required.'
        else if (new Set(q.options).size !== q.options.length) error = 'Options must be unique.'
      }
      if (!q.correctAnswers || q.correctAnswers.length < 1)
        error = 'At least one correct answer is required.'
      q._error = error
    })
  },
  { immediate: true, deep: true }
)

// Add this watcher after useQuestionValidation is set up
watch(
  [newQ, optionsInput, answersInput],
  () => {
    validateNew()
  },
  { immediate: true, deep: true }
)

const editModalOpen = ref(false)
const editQ = reactive<Partial<Question>>({})
const editOptionsInput = ref('')
const editAnswersInput = ref('')
let editIndex = -1

const editErrors = reactive({
  content: false,
  duplicate: false,
  options: false,
  correctAnswers: false,
  correctAnswersMsg: '',
})

function openEditModal(q: Question, idx: number) {
  editQ.id = q.id
  editQ.type = q.type
  editQ.content = q.content
  editQ.options = q.options ? [...q.options] : []
  editQ.correctAnswers = [...q.correctAnswers]
  editQ.explanation = q.explanation || ''
  editOptionsInput.value = (q.options || []).join(', ')
  editAnswersInput.value = (q.correctAnswers || []).join(', ')
  editIndex = idx
  editModalOpen.value = true
}
function closeEditModal() {
  editModalOpen.value = false
  editIndex = -1
}
function validateEdit() {
  editErrors.content = !editQ.content
  editErrors.duplicate = questions.value.some(
    (q, idx) =>
      normalizeQuestionContent(q.content || '') === normalizeQuestionContent(editQ.content || '') &&
      idx !== editIndex
  )
  if (editQ.type !== 'short-text') {
    const opts = editOptionsInput.value
      .split(',')
      .map(o => o.trim())
      .filter(Boolean)
    editErrors.options = opts.length < 2 || new Set(opts).size !== opts.length
  } else {
    editErrors.options = false
  }
  const corrects = editAnswersInput.value
    .split(',')
    .map(a => a.trim())
    .filter(Boolean)
  editErrors.correctAnswers = corrects.length < 1
  if (editQ.type !== 'short-text') {
    const opts = editOptionsInput.value
      .split(',')
      .map(o => o.trim())
      .filter(Boolean)
    if (corrects.some(ans => !opts.includes(ans))) {
      editErrors.correctAnswers = true
      editErrors.correctAnswersMsg = 'All correct answers must be present in the options.'
    } else if (corrects.length < 1) {
      editErrors.correctAnswersMsg = 'At least one correct answer is required.'
    } else {
      editErrors.correctAnswersMsg = ''
    }
  } else {
    editErrors.correctAnswersMsg =
      corrects.length < 1 ? 'At least one correct answer is required.' : ''
  }
}

watch([() => editQ.content, () => editQ.type, editOptionsInput, editAnswersInput], validateEdit, {
  immediate: true,
})

function saveEdit() {
  validateEdit()
  if (editErrors.content || editErrors.duplicate || editErrors.options || editErrors.correctAnswers)
    return
  const updatedQ: Question = {
    id: editQ.id!,
    type: editQ.type as QuestionType,
    content: editQ.content!,
    options:
      editQ.type !== 'short-text'
        ? editOptionsInput.value
            .split(',')
            .map(o => o.trim())
            .filter(Boolean)
        : [],
    correctAnswers: editAnswersInput.value
      .split(',')
      .map(a => a.trim())
      .filter(Boolean),
    explanation: editQ.explanation || '',
    _error: undefined,
  }
  const updated = [...questions.value]
  updated[editIndex] = updatedQ
  questions.value = updated
  closeEditModal()
}
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
