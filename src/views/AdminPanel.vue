<template>
  <div class="max-w-3xl mx-auto p-8">
    <h1 class="text-2xl font-bold mb-6">Admin Panel</h1>
    <AdminQuizList @create="onCreate" @edit="onEdit" @delete="onDelete" />
  </div>
</template>

<script setup lang="ts">
import AdminQuizList from '../components/AdminQuizList.vue'

function onCreate() {
  // TODO: Show quiz creation form
  alert('Create new quiz (form coming soon)')
}

function onEdit(quiz: any) {
  // TODO: Show quiz edit form
  alert(`Edit quiz: ${quiz.title} (form coming soon)`)
}

function onDelete(id: string) {
  // TODO: Confirm and delete quiz
  alert(`Delete quiz with id: ${id} (delete logic coming soon)`)
}
</script> 