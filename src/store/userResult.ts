import { defineStore } from 'pinia'
import type { UserResult } from '../types/userResult'
import { userResultService } from '../services/userResultService'

export const useUserResultStore = defineStore('userResult', {
  state: () => ({
    results: [] as UserResult[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchAllResults() {
      this.loading = true
      try {
        const results = await userResultService.getAllResults()
        console.log('fetchAllResults got:', results)
        this.results = results
      } catch (err) {
        this.error = (err as Error).message
      } finally {
        this.loading = false
      }
    },

    async addResult(result: Omit<UserResult, 'id'>) {
      this.loading = true
      try {
        const id = await userResultService.addResult(result)
        this.results.push({ ...result, id })
      } catch (err) {
        this.error = (err as Error).message
      } finally {
        this.loading = false
      }
    },

    async getResultsByUser(userId: string) {
      this.loading = true
      try {
        return await userResultService.getResultsByUser(userId)
      } catch (err) {
        this.error = (err as Error).message
        return []
      } finally {
        this.loading = false
      }
    },

    async getResultsByQuiz(quizId: string) {
      this.loading = true
      try {
        return await userResultService.getResultsByQuiz(quizId)
      } catch (err) {
        this.error = (err as Error).message
        return []
      } finally {
        this.loading = false
      }
    },
  },
})
