<template>
  <div class="space-y-4 bg-white dark:bg-gray-800 p-6 rounded shadow">
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {{ error }}
    </div>
    <div>
      <label class="block font-semibold mb-1">Title</label>
      <input
        v-model="form.title"
        type="text"
        class="input"
        :class="{ 'border-red-500': $v.form.title.$error && $v.form.title.$dirty }"
        required
        :disabled="loading"
        @blur="$v.form.title.$touch()"
      />
      <div v-if="$v.form.title.$error && $v.form.title.$dirty" class="text-red-500 text-xs mt-1">
        Title is required.
      </div>
    </div>
    <div>
      <label class="block font-semibold mb-1">Description</label>
      <textarea
        v-model="form.description"
        class="input"
        :class="{ 'border-red-500': $v.form.description.$error && $v.form.description.$dirty }"
        required
        :disabled="loading"
        @blur="$v.form.description.$touch()"
      />
      <div
        v-if="$v.form.description.$error && $v.form.description.$dirty"
        class="text-red-500 text-xs mt-1"
      >
        Description is required.
      </div>
    </div>
    <div>
      <label class="block font-semibold mb-1">Tags (comma separated)</label>
      <input v-model="tagsInput" type="text" class="input" :disabled="loading" />
    </div>
    <div>
      <label class="inline-flex items-center">
        <input v-model="form.published" type="checkbox" class="mr-2" :disabled="loading" />
        Published
      </label>
    </div>
    <div>
      <AdminQuestionBuilder v-model="questionsProxy" :disabled="loading" />
      <div v-if="$v.form.questions.$error" class="text-red-500 text-xs mt-1">
        At least one question is required.
      </div>
    </div>
    <div v-if="$v.$error && $v.$dirty" class="text-red-500 text-xs mt-2">
      Please fill in all required fields above to save the quiz.
    </div>
    <div class="flex gap-2 mt-6">
      <button
        type="button"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="loading"
        @click="onSubmit"
      >
        <span v-if="loading" class="inline-flex items-center">
          <svg
            class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Saving...
        </span>
        <span v-else>Save</span>
      </button>
      <button
        type="button"
        class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600 disabled:opacity-50"
        :disabled="loading"
        @click="$emit('cancel')"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, minLength } from '@vuelidate/validators'
import type { Quiz } from '../types/quiz'
import { useQuizStore } from '../store/quiz'
import AdminQuestionBuilder from './AdminQuestionBuilder.vue'

const props = defineProps<{
  modelValue?: Quiz | null
}>()
const emit = defineEmits(['save', 'cancel'])

const quizStore = useQuizStore()
const loading = ref(false)
const error = ref<string | null>(null)

const form = ref<Partial<Quiz>>({
  title: '',
  description: '',
  tags: [],
  published: false,
  questions: [],
})

const tagsInput = ref('')
const lastQuizId = ref<string | null>(null)

const rules = {
  form: {
    title: { required },
    description: { required },
    questions: { required, minLength: minLength(1) },
  },
}

const $v = useVuelidate(rules, { form })

const questionsProxy = computed({
  get: () => form.value.questions ?? [],
  set: val => {
    form.value.questions = val
  },
})

watch(
  () => props.modelValue?.id,
  id => {
    if (id && id !== lastQuizId.value) {
      const val = props.modelValue
      form.value = { ...val, questions: val?.questions ? [...val.questions] : [] }
      tagsInput.value = val?.tags.join(', ') || ''
      lastQuizId.value = id
      $v.value.$reset()
    } else if (!id) {
      form.value = { title: '', description: '', tags: [], published: false, questions: [] }
      tagsInput.value = ''
      lastQuizId.value = null
      $v.value.$reset()
    }
    if (!form.value.questions) form.value.questions = []
  },
  { immediate: true }
)

watch(tagsInput, (val: string) => {
  form.value.tags = val
    .split(',')
    .map((t: string) => t.trim())
    .filter(Boolean)
})

// Handles both add and update quiz logic
async function onSubmit() {
  $v.value.$touch()
  if ($v.value.$invalid) return
  loading.value = true
  error.value = null
  try {
    const quizData = {
      ...form.value,
      title: form.value.title || '',
      description: form.value.description || '',
      published: form.value.published || false,
      tags: form.value.tags || [],
      questions: form.value.questions || [],
      timer: form.value.timer || 0,
    }
    if (props.modelValue?.id) {
      await quizStore.updateQuiz({ ...quizData, id: props.modelValue.id } as Quiz)
    } else {
      await quizStore.addQuiz(quizData as Omit<Quiz, 'id'>)
    }
    emit('save', quizData)
  } catch (err) {
    error.value = (err as Error).message
    console.error('Failed to save quiz:', err)
  } finally {
    loading.value = false
  }
}

defineExpose({
  onSubmit,
  error,
  form,
  $v,
  loading,
})
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
