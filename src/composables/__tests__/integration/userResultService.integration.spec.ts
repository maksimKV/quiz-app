import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userResultService } from '../../../services/userResultService'
import type { UserResult } from '../../../types/userResult'
import * as firestore from 'firebase/firestore'
import type {
  Firestore,
  QueryDocumentSnapshot,
  DocumentReference,
  QuerySnapshot,
} from 'firebase/firestore'

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  getFirestore: vi.fn(() => ({})),
}))

describe('userResultService integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits and retrieves results', async () => {
    const mockedFirestore = vi.mocked(firestore)
    // Add result
    mockedFirestore.addDoc.mockResolvedValueOnce({
      id: 'r1',
      firestore: {} as Firestore,
      path: '',
      parent: {},
      converter: {},
      type: 'document',
    } as unknown as DocumentReference)
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
    const id = await userResultService.addResult(result)
    expect(id).toBe('r1')
    // Get by user
    mockedFirestore.getDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'r1',
          data: () => result,
          metadata: {},
          exists: () => true,
          get: () => undefined,
          toJSON: () => ({}),
          ref: {},
        } as unknown as QueryDocumentSnapshot,
      ],
      metadata: {},
      query: {},
      size: 1,
      empty: false,
      forEach: () => {},
      docChanges: () => [],
    } as unknown as QuerySnapshot)
    const results = await userResultService.getResultsByUser('u1')
    expect(results[0]).toMatchObject(result)
  })
})
