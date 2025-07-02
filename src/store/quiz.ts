import { defineStore } from 'pinia'
import type { Quiz } from '../types/quiz'

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

export const useQuizStore = defineStore('quiz', {
  state: () => ({
    quizzes: mockQuizzes as Quiz[],
  }),
  actions: {
    addQuiz(quiz: Quiz) {
      this.quizzes.push(quiz)
    },
    updateQuiz(updated: Quiz) {
      const idx = this.quizzes.findIndex(q => q.id === updated.id)
      if (idx !== -1) this.quizzes[idx] = updated
    },
    deleteQuiz(id: string) {
      this.quizzes = this.quizzes.filter(q => q.id !== id)
    },
  },
}) 