<template>
  <form class="space-y-4 bg-white dark:bg-gray-800 p-6 rounded shadow" @submit.prevent="onSubmit">
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {{ error }}
    </div>
    <div>
      <label class="block font-semibold mb-1">Title</label>
      <input
        v-model="form.title"
        type="text"
        class="input"
        :class="{ 'border-red-500': $v.form.title.$error }"
        required
        :disabled="loading"
      />
      <div v-if="$v.form.title.$error" class="text-red-500 text-xs mt-1">Title is required.</div>
    </div>
    <div>
      <label class="block font-semibold mb-1">Description</label>
      <textarea
        v-model="form.description"
        class="input"
        :class="{ 'border-red-500': $v.form.description.$error }"
        required
        :disabled="loading"
      />
      <div v-if="$v.form.description.$error" class="text-red-500 text-xs mt-1">
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
      <AdminQuestionBuilder v-model="form.questions" :disabled="loading" />
      <div v-if="$v.form.questions.$error" class="text-red-500 text-xs mt-1">
        At least one question is required.
      </div>
    </div>
    <div class="flex gap-2 mt-6">
      <button
        type="submit"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="$v.$invalid || loading"
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
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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

const rules = {
  form: {
    title: { required },
    description: { required },
    questions: { required, minLength: minLength(1) },
  },
}

const $v = useVuelidate(rules, { form })

watch(
  () => props.modelValue,
  (val: Quiz | null | undefined) => {
    if (val) {
      form.value = { ...val }
      tagsInput.value = val.tags.join(', ')
      if (!form.value.questions) form.value.questions = []
    } else {
      form.value = { title: '', description: '', tags: [], published: false, questions: [] }
      tagsInput.value = ''
    }
    $v.value.$reset()
  },
  { immediate: true }
)

watch(tagsInput, (val: string) => {
  form.value.tags = val
    .split(',')
    .map((t: string) => t.trim())
    .filter(Boolean)
})

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
