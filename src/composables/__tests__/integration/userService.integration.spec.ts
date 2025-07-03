import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userService } from '../../../services/userService'
import type { User } from '../../../types/user'
import * as firestore from 'firebase/firestore'
import type { DocumentSnapshot } from 'firebase/firestore'

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  arrayUnion: vi.fn((badge: string) => badge),
  getFirestore: vi.fn(() => ({})),
}))

describe('userService integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches and updates user info', async () => {
    const mockedFirestore = vi.mocked(firestore)
    // Fetch
    const userData: Omit<User, 'id' | 'uid'> = {
      name: 'Test',
      email: 'a@example.com',
      isAdmin: false,
      xp: 0,
      badges: [],
      streak: { count: 0, lastDate: '', longest: 0 },
    }
    mockedFirestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'u1',
      data: () => userData,
      ref: {},
    } as unknown as DocumentSnapshot)
    const user = await userService.getUserById('u1')
    expect(user).toMatchObject({ id: 'u1', ...userData })
    // Update XP
    mockedFirestore.updateDoc.mockResolvedValueOnce(undefined)
    await userService.updateXP('u1', 10)
    expect(firestore.updateDoc).toHaveBeenCalledWith(expect.anything(), { xp: 10 })
    // Add badge
    await userService.addBadge('u1', 'winner')
    expect(firestore.updateDoc).toHaveBeenCalledWith(expect.anything(), { badges: 'winner' })
    // Update streak
    await userService.updateStreak('u1', 2, '2024-01-01')
    expect(firestore.updateDoc).toHaveBeenCalledWith(expect.anything(), {
      streak: { count: 2, lastDate: '2024-01-01' },
    })
    // Set fields
    mockedFirestore.setDoc.mockResolvedValueOnce(undefined)
    await userService.setUserFields('u1', { name: 'New' })
    expect(firestore.setDoc).toHaveBeenCalledWith(
      expect.anything(),
      { name: 'New' },
      { merge: true }
    )
  })
})
