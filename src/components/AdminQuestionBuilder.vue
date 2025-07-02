<template>
  <div>
    <h3 class="font-semibold mb-2">Questions</h3>
    <div v-if="questions.length === 0" class="text-gray-500 mb-4">No questions yet.</div>
    <ul class="space-y-4 mb-4">
      <li v-for="(q, idx) in questions" :key="q.id" class="bg-gray-50 dark:bg-gray-900 p-4 rounded shadow">
        <div class="flex justify-between items-center mb-2">
          <span class="font-bold">Q{{ idx + 1 }}: {{ q.content }}</span>
          <button class="text-red-500 hover:underline" @click="removeQuestion(q.id)">Remove</button>
        </div>
        <div class="text-xs text-gray-500 mb-1">Type: {{ q.type }}</div>
        <div v-if="q.type !== 'short-text'">
          <div v-for="(opt, oidx) in q.options" :key="oidx" class="ml-4 text-sm">- {{ opt }}</div>
        </div>
        <div v-if="q.explanation" class="ml-4 text-xs text-green-700">Explanation: {{ q.explanation }}</div>
      </li>
    </ul>
    <form @submit.prevent="addQuestion" class="space-y-2 bg-gray-100 dark:bg-gray-800 p-4 rounded">
      <div>
        <label class="block font-semibold mb-1">Type</label>
        <select v-model="newQ.type" class="input" required>
          <option value="multiple-choice">Multiple Choice</option>
          <option value="multiple-answer">Multiple Answer</option>
          <option value="short-text">Short Text</option>
        </select>
      </div>
      <div>
        <label class="block font-semibold mb-1">Question</label>
        <input v-model="newQ.content" type="text" class="input" required />
      </div>
      <div v-if="newQ.type !== 'short-text'">
        <label class="block font-semibold mb-1">Options (comma separated)</label>
        <input v-model="optionsInput" type="text" class="input" />
      </div>
      <div>
        <label class="block font-semibold mb-1">Correct Answer(s) (comma separated)</label>
        <input v-model="answersInput" type="text" class="input" />
      </div>
      <div>
        <label class="block font-semibold mb-1">Explanation (optional)</label>
        <input v-model="newQ.explanation" type="text" class="input" />
      </div>
      <button type="submit" class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Add Question</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Question, QuestionType } from '../types/quiz'

const props = defineProps<{
  modelValue: Question[]
}>()
const emit = defineEmits(['update:modelValue'])

const questions = ref<Question[]>(props.modelValue || [])

watch(() => props.modelValue, (val) => {
  questions.value = val || []
})

function removeQuestion(id: string) {
  questions.value = questions.value.filter(q => q.id !== id)
  emit('update:modelValue', questions.value)
}

const newQ = ref<Partial<Question>>({
  type: 'multiple-choice',
  content: '',
  options: [],
  correctAnswers: [],
  explanation: '',
})
const optionsInput = ref('')
const answersInput = ref('')

function addQuestion() {
  if (!newQ.value.content || !newQ.value.type) return
  const id = Date.now().toString() + Math.random().toString(36).slice(2)
  const options = newQ.value.type !== 'short-text' ? optionsInput.value.split(',').map(o => o.trim()).filter(Boolean) : []
  const correctAnswers = answersInput.value.split(',').map(a => a.trim()).filter(Boolean)
  questions.value.push({
    id,
    type: newQ.value.type as QuestionType,
    content: newQ.value.content,
    options,
    correctAnswers,
    explanation: newQ.value.explanation || '',
  })
  emit('update:modelValue', questions.value)
  newQ.value = { type: 'multiple-choice', content: '', options: [], correctAnswers: [], explanation: '' }
  optionsInput.value = ''
  answersInput.value = ''
}
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700;
}
</style> 