import { defineStore } from 'pinia'
import type { Quiz } from '../types/quiz'
import { quizService } from '../services/quizService'
import { ref, onUnmounted } from 'vue'

export const useQuizStore = defineStore('quiz', () => {
  const quizzes = ref<Quiz[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let unsubscribeQuizzes: (() => void) | null = null

  function subscribeToQuizzes() {
    unsubscribeQuizzes = quizService.subscribeToPublishedQuizzes(updatedQuizzes => {
      quizzes.value = updatedQuizzes
    })
  }

  onUnmounted(() => {
    if (unsubscribeQuizzes) {
      unsubscribeQuizzes()
    }
  })

  async function addQuiz(quiz: Omit<Quiz, 'id'>) {
    loading.value = true
    error.value = null
    try {
      await quizService.createQuiz(quiz)
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  async function updateQuiz(quiz: Quiz) {
    loading.value = true
    error.value = null
    try {
      await quizService.updateQuiz(quiz.id, quiz)
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  async function deleteQuiz(id: string) {
    loading.value = true
    error.value = null
    try {
      await quizService.deleteQuiz(id)
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  async function fetchQuizzes() {
    loading.value = true
    error.value = null
    try {
      const allQuizzes = await quizService.getAllQuizzes()
      quizzes.value = allQuizzes
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  subscribeToQuizzes()

  return {
    quizzes,
    loading,
    error,
    addQuiz,
    updateQuiz,
    deleteQuiz,
    fetchQuizzes,
  }
})
