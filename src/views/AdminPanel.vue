<template>
  <div class="max-w-3xl mx-auto p-8">
    <h1 class="text-2xl font-bold mb-6">Admin Panel</h1>
    <AdminQuizList v-if="!showForm" @create="onCreate" @edit="onEdit" @delete="onDelete" />
    <AdminQuizForm
      v-else
      :model-value="editingQuiz"
      @save="onSave"
      @cancel="onCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuizStore } from '../store/quiz'
import AdminQuizList from '../components/AdminQuizList.vue'
import AdminQuizForm from '../components/AdminQuizForm.vue'
import type { Quiz } from '../types/quiz'

const quizStore = useQuizStore()
const showForm = ref(false)
const editingQuiz = ref<Quiz | null>(null)

function onCreate() {
  editingQuiz.value = null
  showForm.value = true
}

function onEdit(quiz: Quiz) {
  editingQuiz.value = quiz
  showForm.value = true
}

function onDelete(id: string) {
  if (confirm('Are you sure you want to delete this quiz?')) {
    quizStore.deleteQuiz(id)
  }
}

function onSave(quiz: Quiz) {
  if (editingQuiz.value) {
    quizStore.updateQuiz(quiz)
  } else {
    quizStore.addQuiz({ ...quiz, id: Date.now().toString(), questions: quiz.questions || [] })
  }
  showForm.value = false
}

function onCancel() {
  showForm.value = false
}
</script> 