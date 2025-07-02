import { defineStore } from 'pinia'
import type { Quiz } from '../types/quiz'
import { quizService } from '../services/quizService'

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
    quizzes: [] as Quiz[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchQuizzes() {
      this.loading = true;
      try {
        this.quizzes = await quizService.getAllQuizzes();
      } catch (err) {
        this.error = (err as Error).message;
      } finally {
        this.loading = false;
      }
    },

    async fetchPublishedQuizzes() {
      this.loading = true;
      try {
        this.quizzes = await quizService.getPublishedQuizzes();
      } catch (err) {
        this.error = (err as Error).message;
      } finally {
        this.loading = false;
      }
    },

    async addQuiz(quiz: Omit<Quiz, 'id'>) {
      this.loading = true;
      try {
        const id = await quizService.createQuiz(quiz);
        this.quizzes.push({ ...quiz, id });
      } catch (err) {
        this.error = (err as Error).message;
      } finally {
        this.loading = false;
      }
    },

    async updateQuiz(updated: Quiz) {
      this.loading = true;
      try {
        await quizService.updateQuiz(updated.id, updated);
        const idx = this.quizzes.findIndex(q => q.id === updated.id);
        if (idx !== -1) this.quizzes[idx] = updated;
      } catch (err) {
        this.error = (err as Error).message;
      } finally {
        this.loading = false;
      }
    },

    async deleteQuiz(id: string) {
      this.loading = true;
      try {
        await quizService.deleteQuiz(id);
        this.quizzes = this.quizzes.filter(q => q.id !== id);
      } catch (err) {
        this.error = (err as Error).message;
      } finally {
        this.loading = false;
      }
    },
  },
}) 