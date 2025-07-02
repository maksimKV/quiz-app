<template>
  <form @submit.prevent="onSubmit" class="space-y-4 bg-white dark:bg-gray-800 p-6 rounded shadow">
    <div>
      <label class="block font-semibold mb-1">Title</label>
      <input v-model="form.title" type="text" class="input" required />
    </div>
    <div>
      <label class="block font-semibold mb-1">Description</label>
      <textarea v-model="form.description" class="input" required />
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
      <label class="block font-semibold mb-1">Questions</label>
      <div class="text-gray-500 italic">(Question builder coming soon...)</div>
    </div>
    <div class="flex gap-2 mt-6">
      <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
      <button type="button" class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600" @click="$emit('cancel')">Cancel</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Quiz } from '../types/quiz'

const props = defineProps<{
  modelValue?: Quiz | null
}>()
const emit = defineEmits(['save', 'cancel'])

const form = ref<Partial<Quiz>>({
  title: '',
  description: '',
  tags: [],
  published: false,
})

const tagsInput = ref('')

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      form.value = { ...val }
      tagsInput.value = val.tags.join(', ')
    } else {
      form.value = { title: '', description: '', tags: [], published: false }
      tagsInput.value = ''
    }
  },
  { immediate: true }
)

watch(tagsInput, (val) => {
  form.value.tags = val.split(',').map(t => t.trim()).filter(Boolean)
})

function onSubmit() {
  if (!form.value.title || !form.value.description) return
  emit('save', { ...form.value, tags: form.value.tags || [] })
}
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700;
}
</style> 