import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/firestore', () => {
  return {
    doc: vi.fn(() => ({})),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    arrayUnion: vi.fn((badge: string) => badge),
    getFirestore: vi.fn(() => ({})),
  }
})

import * as firestore from 'firebase/firestore'
import { userService } from '../../../services/userService'
import type { User } from '../../../types/user'

type VitestMock = ReturnType<typeof vi.fn>

describe('userService', () => {
  const mockUser: User = {
    id: 'user123',
    uid: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    isAdmin: false,
    xp: 100,
    badges: ['starter'],
    streak: { count: 2, lastDate: '2024-06-01', longest: 5 },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch user by ID and return correct user data', async () => {
    ;(firestore.getDoc as VitestMock).mockResolvedValueOnce({
      exists: () => true,
      id: mockUser.id,
      data: () => ({
        name: mockUser.name,
        email: mockUser.email,
        isAdmin: mockUser.isAdmin,
        xp: mockUser.xp,
        badges: mockUser.badges,
        streak: mockUser.streak,
      }),
    })
    const user = await userService.getUserById('user123')
    expect(user).toMatchObject(mockUser)
    expect(firestore.getDoc).toHaveBeenCalled()
  })

  it('should return null for non-existent user', async () => {
    ;(firestore.getDoc as VitestMock).mockResolvedValueOnce({ exists: () => false })
    const user = await userService.getUserById('nope')
    expect(user).toBeNull()
    expect(firestore.getDoc).toHaveBeenCalled()
  })

  it('should update XP field correctly', async () => {
    ;(firestore.updateDoc as VitestMock).mockResolvedValueOnce(undefined)
    await userService.updateXP('user123', 200)
    expect(firestore.updateDoc).toHaveBeenCalledWith(expect.anything(), { xp: 200 })
  })

  it('should add badge correctly', async () => {
    ;(firestore.updateDoc as VitestMock).mockResolvedValueOnce(undefined)
    await userService.addBadge('user123', 'winner')
    expect(firestore.updateDoc).toHaveBeenCalledWith(expect.anything(), { badges: 'winner' })
  })

  it('should update streak fields correctly', async () => {
    ;(firestore.updateDoc as VitestMock).mockResolvedValueOnce(undefined)
    await userService.updateStreak('user123', 3, '2024-06-02')
    expect(firestore.updateDoc).toHaveBeenCalledWith(expect.anything(), {
      streak: { count: 3, lastDate: '2024-06-02' },
    })
  })

  it('should create/update user document with correct fields', async () => {
    ;(firestore.setDoc as VitestMock).mockResolvedValueOnce(undefined)
    const fields = { name: 'New Name', xp: 500 }
    await userService.setUserFields('user123', fields)
    expect(firestore.setDoc).toHaveBeenCalledWith(expect.anything(), fields, { merge: true })
  })
})
