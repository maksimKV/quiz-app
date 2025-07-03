import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQuizStore } from '../../../store/quiz'
import { quizService } from '../../../services/quizService'
import type { Quiz } from '../../../types/quiz'

vi.mock('../../../services/quizService', () => ({
  quizService: {
    createQuiz: vi.fn(),
    updateQuiz: vi.fn(),
    deleteQuiz: vi.fn(),
    getAllQuizzes: vi.fn(),
    subscribeToPublishedQuizzes: vi.fn(() => () => {}),
  },
}))

describe('quiz store integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('adds a quiz', async () => {
    const store = useQuizStore()
    const quizData: Omit<Quiz, 'id'> = {
      title: 'Quiz',
      description: '',
      tags: [],
      published: true,
      questions: [],
    }
    ;(quizService.createQuiz as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('quiz1')
    await store.addQuiz(quizData)
    expect(quizService.createQuiz).toHaveBeenCalledWith(quizData)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('updates a quiz', async () => {
    const store = useQuizStore()
    const quiz: Quiz = {
      id: 'quiz1',
      title: 'Quiz',
      description: '',
      tags: [],
      published: true,
      questions: [],
    }
    ;(quizService.updateQuiz as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      undefined
    )
    await store.updateQuiz(quiz)
    expect(quizService.updateQuiz).toHaveBeenCalledWith('quiz1', quiz)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('deletes a quiz', async () => {
    const store = useQuizStore()
    ;(quizService.deleteQuiz as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      undefined
    )
    await store.deleteQuiz('quiz1')
    expect(quizService.deleteQuiz).toHaveBeenCalledWith('quiz1')
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetches quizzes', async () => {
    const store = useQuizStore()
    const quizzes: Quiz[] = [
      { id: 'quiz1', title: 'Quiz', description: '', tags: [], published: true, questions: [] },
    ]
    ;(quizService.getAllQuizzes as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      quizzes
    )
    await store.fetchQuizzes()
    expect(quizService.getAllQuizzes).toHaveBeenCalled()
    expect(store.quizzes).toEqual(quizzes)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })
})
