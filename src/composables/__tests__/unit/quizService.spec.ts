import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn(() => ({})),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(() => ({})),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
    query: vi.fn(() => ({})),
    where: vi.fn(() => ({})),
    onSnapshot: vi.fn(),
    getFirestore: vi.fn(() => ({})),
  }
})

import * as firestore from 'firebase/firestore'
import { quizService } from '../../../services/quizService'
import type { Quiz } from '../../../types/quiz'

type VitestMock = ReturnType<typeof vi.fn>

describe('quizService', () => {
  const mockQuiz: Quiz = {
    id: 'quiz1',
    title: 'Sample Quiz',
    description: 'A test quiz',
    tags: ['test'],
    published: true,
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        content: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctAnswers: ['4'],
      },
    ],
    timer: 60,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch all quizzes and return correct data', async () => {
    ;(firestore.getDocs as VitestMock).mockResolvedValueOnce({
      docs: [
        {
          id: mockQuiz.id,
          data: () => ({
            title: mockQuiz.title,
            description: mockQuiz.description,
            tags: mockQuiz.tags,
            published: mockQuiz.published,
            questions: mockQuiz.questions,
            timer: mockQuiz.timer,
          }),
        },
      ],
    })
    const quizzes = await quizService.getAllQuizzes()
    expect(quizzes).toHaveLength(1)
    expect(quizzes[0]).toMatchObject(mockQuiz)
    expect(firestore.getDocs).toHaveBeenCalled()
  })

  it('should add a quiz and return its id', async () => {
    ;(firestore.addDoc as VitestMock).mockResolvedValueOnce({ id: 'quiz1' })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- needed to omit 'id' for test data
    const { id, ...quizData } = mockQuiz
    const returnedId = await quizService.createQuiz(quizData)
    expect(returnedId).toBe('quiz1')
    expect(firestore.addDoc).toHaveBeenCalled()
  })

  it('should update a quiz', async () => {
    ;(firestore.updateDoc as VitestMock).mockResolvedValueOnce(undefined)
    await quizService.updateQuiz('quiz1', { title: 'Updated Title' })
    expect(firestore.updateDoc).toHaveBeenCalledWith(expect.anything(), { title: 'Updated Title' })
  })

  it('should delete a quiz', async () => {
    ;(firestore.deleteDoc as VitestMock).mockResolvedValueOnce(undefined)
    await quizService.deleteQuiz('quiz1')
    expect(firestore.deleteDoc).toHaveBeenCalledWith(expect.anything())
  })

  it('should subscribe to quiz updates and update state', () => {
    const unsubscribe = vi.fn()
    ;(firestore.onSnapshot as VitestMock).mockImplementation((_docRef, cb) => {
      cb({
        exists: () => true,
        id: mockQuiz.id,
        data: () => ({
          title: mockQuiz.title,
          description: mockQuiz.description,
          tags: mockQuiz.tags,
          published: mockQuiz.published,
          questions: mockQuiz.questions,
          timer: mockQuiz.timer,
        }),
      })
      return unsubscribe
    })
    const callback = vi.fn()
    const unsub = quizService.subscribeToQuiz('quiz1', callback)
    expect(callback).toHaveBeenCalledWith(mockQuiz)
    expect(typeof unsub).toBe('function')
  })
})
