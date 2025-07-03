import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserResultStore } from '../../../store/userResult'
import type { UserResult } from '../../../types/userResult'

// Mock Firestore methods
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  getFirestore: vi.fn(() => ({})),
}))

import * as firestore from 'firebase/firestore'

describe('userResultService & userResult store', () => {
  const mockResult: UserResult = {
    id: 'result1',
    userId: 'user1',
    quizId: 'quiz1',
    score: 8,
    maxScore: 10,
    percentage: 80,
    answers: { q1: 'a', q2: ['b', 'c'] },
    completedAt: '2024-01-01T00:00:00Z',
    timeSpent: 120,
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('Should fetch all results and return correct data.', async () => {
    ;(firestore.getDocs as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      docs: [
        {
          id: mockResult.id,
          data: () => ({
            userId: mockResult.userId,
            quizId: mockResult.quizId,
            score: mockResult.score,
            maxScore: mockResult.maxScore,
            percentage: mockResult.percentage,
            answers: mockResult.answers,
            completedAt: mockResult.completedAt,
            timeSpent: mockResult.timeSpent,
          }),
        },
      ],
    })
    const store = useUserResultStore()
    await store.fetchAllResults()
    expect(store.results).toHaveLength(1)
    expect(store.results[0]).toMatchObject(mockResult)
    expect(firestore.getDocs).toHaveBeenCalled()
  })

  it('Should add a new result and update state.', async () => {
    ;(firestore.addDoc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'result2' })
    const store = useUserResultStore()
    const newResult = { ...mockResult, id: undefined } as Omit<UserResult, 'id'>
    await store.addResult(newResult)
    expect(store.results[0]).toMatchObject({ ...newResult, id: 'result2' })
    expect(firestore.addDoc).toHaveBeenCalled()
  })

  it('Should fetch results by user', async () => {
    ;(firestore.getDocs as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      docs: [
        {
          id: mockResult.id,
          data: () => ({ ...mockResult, id: undefined }),
        },
      ],
    })
    const store = useUserResultStore()
    const results = await store.getResultsByUser('user1')
    expect(results).toHaveLength(1)
    expect(results[0].userId).toBe('user1')
    expect(firestore.getDocs).toHaveBeenCalled()
  })

  it('Should fetch results by quiz', async () => {
    ;(firestore.getDocs as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      docs: [
        {
          id: mockResult.id,
          data: () => ({ ...mockResult, id: undefined }),
        },
      ],
    })
    const store = useUserResultStore()
    const results = await store.getResultsByQuiz('quiz1')
    expect(results).toHaveLength(1)
    expect(results[0].quizId).toBe('quiz1')
    expect(firestore.getDocs).toHaveBeenCalled()
  })

  it('Should handle errors (e.g., network, permission denied)', async () => {
    ;(firestore.getDocs as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error')
    )
    const store = useUserResultStore()
    await store.fetchAllResults()
    expect(store.error).toBe('Network error')
    ;(firestore.addDoc as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Permission denied')
    )
    await store.addResult({ ...mockResult, id: undefined } as Omit<UserResult, 'id'>)
    expect(store.error).toBe('Permission denied')
  })
})
