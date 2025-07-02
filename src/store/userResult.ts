import { defineStore } from 'pinia'
import type { UserResult } from '../types/userResult'

export const useUserResultStore = defineStore('userResult', {
  state: () => ({
    results: [] as UserResult[],
  }),
  actions: {
    addResult(result: UserResult) {
      this.results.push(result)
    },
    getResultsByUser(userId: string) {
      return this.results.filter(r => r.userId === userId)
    },
    getResultsByQuiz(quizId: string) {
      return this.results.filter(r => r.quizId === quizId)
    },
  },
}) 