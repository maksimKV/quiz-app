<template>
  <form @submit.prevent="onSubmit" class="space-y-4 bg-white dark:bg-gray-800 p-6 rounded shadow">
    <div>
      <label class="block font-semibold mb-1">Title</label>
      <input v-model="form.title" type="text" class="input" :class="{'border-red-500': $v.form.title.$error}" required />
      <div v-if="$v.form.title.$error" class="text-red-500 text-xs mt-1">Title is required.</div>
    </div>
    <div>
      <label class="block font-semibold mb-1">Description</label>
      <textarea v-model="form.description" class="input" :class="{'border-red-500': $v.form.description.$error}" required />
      <div v-if="$v.form.description.$error" class="text-red-500 text-xs mt-1">Description is required.</div>
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
      <div v-if="$v.form.questions.$error" class="text-red-500 text-xs mt-1">At least one question is required.</div>
    </div>
    <div class="flex gap-2 mt-6">
      <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" :disabled="$v.$invalid">Save</button>
      <button type="button" class="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600" @click="$emit('cancel')">Cancel</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, minLength } from '@vuelidate/validators'
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

const rules = {
  form: {
    title: { required },
    description: { required },
    questions: { required, minLength: minLength(1) }
  }
}

const $v = useVuelidate(rules, { form })

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
    $v.value.$reset()
  },
  { immediate: true }
)

watch(tagsInput, (val) => {
  form.value.tags = val.split(',').map(t => t.trim()).filter(Boolean)
})

async function onSubmit() {
  $v.value.$touch()
  if ($v.value.$invalid) return
  emit('save', { ...form.value, tags: form.value.tags || [], questions: form.value.questions || [] })
}
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700;
}
</style> 