import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserResultStore } from '../../../store/userResult'
import { userResultService } from '../../../services/userResultService'
import type { UserResult } from '../../../types/userResult'

vi.mock('../../../services/userResultService', () => ({
  userResultService: {
    getAllResults: vi.fn(),
    addResult: vi.fn(),
    getResultsByUser: vi.fn(),
    getResultsByQuiz: vi.fn(),
  },
}))

describe('userResult store integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches all results', async () => {
    const store = useUserResultStore()
    const results: UserResult[] = [
      {
        id: 'r1',
        userId: 'u1',
        quizId: 'q1',
        score: 1,
        maxScore: 1,
        percentage: 100,
        answers: { q1: 'A' },
        completedAt: '',
        timeSpent: 1000,
      },
    ]
    ;(userResultService.getAllResults as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      results
    )
    await store.fetchAllResults()
    expect(userResultService.getAllResults).toHaveBeenCalled()
    expect(store.results).toEqual(results)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('adds a result', async () => {
    const store = useUserResultStore()
    const result: Omit<UserResult, 'id'> = {
      userId: 'u1',
      quizId: 'q1',
      score: 1,
      maxScore: 1,
      percentage: 100,
      answers: { q1: 'A' },
      completedAt: '',
      timeSpent: 1000,
    }
    ;(userResultService.addResult as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      'r1'
    )
    await store.addResult(result)
    expect(userResultService.addResult).toHaveBeenCalledWith(result)
    expect(store.results[0]).toMatchObject({ ...result, id: 'r1' })
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('gets results by user', async () => {
    const store = useUserResultStore()
    const results: UserResult[] = [
      {
        id: 'r1',
        userId: 'u1',
        quizId: 'q1',
        score: 1,
        maxScore: 1,
        percentage: 100,
        answers: { q1: 'A' },
        completedAt: '',
        timeSpent: 1000,
      },
    ]
    ;(
      userResultService.getResultsByUser as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(results)
    const res = await store.getResultsByUser('u1')
    expect(userResultService.getResultsByUser).toHaveBeenCalledWith('u1')
    expect(res).toEqual(results)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('gets results by quiz', async () => {
    const store = useUserResultStore()
    const results: UserResult[] = [
      {
        id: 'r1',
        userId: 'u1',
        quizId: 'q1',
        score: 1,
        maxScore: 1,
        percentage: 100,
        answers: { q1: 'A' },
        completedAt: '',
        timeSpent: 1000,
      },
    ]
    ;(
      userResultService.getResultsByQuiz as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(results)
    const res = await store.getResultsByQuiz('q1')
    expect(userResultService.getResultsByQuiz).toHaveBeenCalledWith('q1')
    expect(res).toEqual(results)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })
})
