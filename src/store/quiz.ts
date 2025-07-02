import { defineStore } from 'pinia'
import type { Quiz } from '../types/quiz'
import { quizService } from '../services/quizService'
import { ref, onUnmounted } from 'vue'

// Mock data for initial quizzes
const mockQuizzes: Quiz[] = [
  {
    id: '1',
    title: 'Sample Quiz',
    description: 'A sample quiz for demonstration.',
    tags: ['sample', 'demo'],
    published: true,
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        content: 'What is 2 + 2?',
        options: ['3', '4', '5'],
        correctAnswers: ['4'],
        explanation: '2 + 2 is 4.',
      },
    ],
    timer: 60,
  },
]

export const useQuizStore = defineStore('quiz', () => {
  const quizzes = ref<Quiz[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let unsubscribeQuizzes: (() => void) | null = null

  // Subscribe to published quizzes
  function subscribeToQuizzes() {
    unsubscribeQuizzes = quizService.subscribeToPublishedQuizzes((updatedQuizzes) => {
      quizzes.value = updatedQuizzes
    })
  }

  // Cleanup subscription
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
      // No need to manually update quizzes array - Firebase listener will handle it
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
      // No need to manually update quizzes array - Firebase listener will handle it
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
      // No need to manually update quizzes array - Firebase listener will handle it
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  // Initialize subscription
  subscribeToQuizzes()

  return {
    quizzes,
    loading,
    error,
    addQuiz,
    updateQuiz,
    deleteQuiz
  }
}) 