<template>
  <form @submit.prevent="onSubmit" class="space-y-4 bg-white dark:bg-gray-800 p-6 rounded shadow">
    <div>
      <label class="block font-semibold mb-1">Title</label>
      <input v-model="form.title" type="text" class="input" :class="{'border-red-500': errors.title}" required />
      <div v-if="errors.title" class="text-red-500 text-xs mt-1">Title is required.</div>
    </div>
    <div>
      <label class="block font-semibold mb-1">Description</label>
      <textarea v-model="form.description" class="input" :class="{'border-red-500': errors.description}" required />
      <div v-if="errors.description" class="text-red-500 text-xs mt-1">Description is required.</div>
    </div>
    <div>
      <label class="block font-semibold mb-1">Tags (comma separated)</label>
      <input v-model="tagsInput" type="text" class="input" />
    </div>
    <div>
      <label class="inline-flex items-center">
        <input v-model="form.published" type="checkbox" class="mr-2" />
        Published
      </label>
    </div>
    <div>
      <AdminQuestionBuilder v-model="form.questions" />
      <div v-if="errors.questions" class="text-red-500 text-xs mt-1">At least one question is required.</div>
    </div>
    <div class="flex gap-2 mt-6">
      <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" :disabled="!isValid">Save</button>
      <button type="button" class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600" @click="$emit('cancel')">Cancel</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Quiz } from '../types/quiz'
import AdminQuestionBuilder from './AdminQuestionBuilder.vue'

const props = defineProps<{
  modelValue?: Quiz | null
}>()
const emit = defineEmits(['save', 'cancel'])

const form = ref<Partial<Quiz>>({
  title: '',
  description: '',
  tags: [],
  published: false,
  questions: [],
})

const tagsInput = ref('')

const errors = ref({
  title: false,
  description: false,
  questions: false,
})

const isValid = computed(() => {
  return !!form.value.title && !!form.value.description && (form.value.questions?.length ?? 0) > 0
})

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      form.value = { ...val }
      tagsInput.value = val.tags.join(', ')
      if (!form.value.questions) form.value.questions = []
    } else {
      form.value = { title: '', description: '', tags: [], published: false, questions: [] }
      tagsInput.value = ''
    }
  },
  { immediate: true }
)

watch(tagsInput, (val) => {
  form.value.tags = val.split(',').map(t => t.trim()).filter(Boolean)
})

function validate() {
  errors.value.title = !form.value.title
  errors.value.description = !form.value.description
  errors.value.questions = !(form.value.questions && form.value.questions.length > 0)
  return !errors.value.title && !errors.value.description && !errors.value.questions
}

function onSubmit() {
  if (!validate()) return
  emit('save', { ...form.value, tags: form.value.tags || [], questions: form.value.questions || [] })
}
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700;
}
</style> 