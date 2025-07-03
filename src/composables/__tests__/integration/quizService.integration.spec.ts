import { describe, it, expect, vi, beforeEach } from 'vitest'
import { quizService } from '../../../services/quizService'
import type { Quiz } from '../../../types/quiz'
import * as firestore from 'firebase/firestore'
import type { DocumentReference, DocumentSnapshot } from 'firebase/firestore'

vi.mock('firebase/firestore', () => ({
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
}))

describe('quizService integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('performs quiz CRUD operations', async () => {
    const mockedFirestore = vi.mocked(firestore)
    // Create
    mockedFirestore.addDoc.mockResolvedValueOnce({
      id: 'quiz1',
      firestore: {},
    } as unknown as DocumentReference)
    const quizData: Omit<Quiz, 'id'> = {
      title: 'Quiz',
      description: '',
      tags: [],
      published: true,
      questions: [],
      timer: 0,
    }
    const id = await quizService.createQuiz(quizData)
    expect(id).toBe('quiz1')
    // Read
    mockedFirestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'quiz1',
      data: () => quizData,
      ref: {},
    } as unknown as DocumentSnapshot)
    const quiz = await quizService.getQuizById('quiz1')
    expect(quiz).toMatchObject({ id: 'quiz1', ...quizData })
    // Update
    mockedFirestore.updateDoc.mockResolvedValueOnce(undefined)
    await quizService.updateQuiz('quiz1', { title: 'Updated' })
    expect(firestore.updateDoc).toHaveBeenCalled()
    // Delete
    mockedFirestore.deleteDoc.mockResolvedValueOnce(undefined)
    await quizService.deleteQuiz('quiz1')
    expect(firestore.deleteDoc).toHaveBeenCalled()
  })
})
