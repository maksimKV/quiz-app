import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Leaderboard from './Leaderboard.vue'
import { setActivePinia, createPinia } from 'pinia'
import { useQuizStore } from '../store/quiz'
import { useUserResultStore } from '../store/userResult'
import { nextTick } from 'vue'
import type { Quiz } from '../types/quiz'
import type { UserResult } from '../types/userResult'

// Mock userService
vi.mock('../services/userService', () => ({
  userService: {
    getUserById: vi.fn(),
  },
}))
import { userService } from '../services/userService'
const getUserByIdMock = userService.getUserById as ReturnType<typeof vi.fn>

// Mock useAuth composable
vi.mock('../composables/useAuth', () => ({
  useAuth: () => ({
    user: { value: { uid: 'user1', displayName: 'Test User', email: 'test@example.com' } },
  }),
}))

// Helper to set up stores
function setupStores({
  quizzes = [],
  results = [],
}: { quizzes?: Quiz[]; results?: UserResult[] } = {}) {
  setActivePinia(createPinia())
  const quizStore = useQuizStore()
  const userResultStore = useUserResultStore()
  quizStore.quizzes = quizzes
  userResultStore.results = results
  userResultStore.fetchAllResults = vi.fn()
  return { quizStore, userResultStore }
}

beforeAll(() => {
  process.on('unhandledRejection', () => {})
})

describe('Leaderboard.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Should display user names/emails for all leaderboard entries', async () => {
    setupStores({
      quizzes: [
        { id: 'quiz1', title: 'Quiz', description: '', tags: [], questions: [], published: true },
      ],
      results: [
        {
          id: 'r1',
          userId: 'user1',
          quizId: 'quiz1',
          score: 100,
          maxScore: 100,
          percentage: 100,
          answers: {},
          completedAt: '',
          timeSpent: 1000,
        },
        {
          id: 'r2',
          userId: 'user2',
          quizId: 'quiz1',
          score: 80,
          maxScore: 100,
          percentage: 80,
          answers: {},
          completedAt: '',
          timeSpent: 1000,
        },
      ],
    })
    getUserByIdMock.mockImplementation(async (uid: string) => {
      if (uid === 'user2')
        return { id: 'user2', uid: 'user2', name: 'Other User', email: 'other@example.com' }
      return null
    })
    const wrapper = mount(Leaderboard)
    await flushPromises()
    await nextTick()
    expect(wrapper.text()).toContain('Test User')
    expect(wrapper.text()).toContain('test@example.com')
    expect(wrapper.text()).toContain('Other User')
    expect(wrapper.text()).toContain('other@example.com')
  })

  it('Should fall back to userId if user info is missing', async () => {
    setupStores({
      quizzes: [
        { id: 'quiz1', title: 'Quiz', description: '', tags: [], questions: [], published: true },
      ],
      results: [
        {
          id: 'r1',
          userId: 'user3',
          quizId: 'quiz1',
          score: 50,
          maxScore: 100,
          percentage: 50,
          answers: {},
          completedAt: '',
          timeSpent: 1000,
        },
      ],
    })
    getUserByIdMock.mockResolvedValue(null)
    const wrapper = mount(Leaderboard)
    await flushPromises()
    await nextTick()
    expect(wrapper.text()).toContain('user3')
  })

  it('Should fetch user info only after leaderboard is populated', async () => {
    setupStores({
      quizzes: [
        { id: 'quiz1', title: 'Quiz', description: '', tags: [], questions: [], published: true },
      ],
      results: [
        {
          id: 'r1',
          userId: 'user4',
          quizId: 'quiz1',
          score: 70,
          maxScore: 100,
          percentage: 70,
          answers: {},
          completedAt: '',
          timeSpent: 1000,
        },
      ],
    })
    const spy = getUserByIdMock
    spy.mockResolvedValue({
      id: 'user4',
      uid: 'user4',
      name: 'Fourth User',
      email: 'fourth@example.com',
    })
    const wrapper = mount(Leaderboard)
    await flushPromises()
    await nextTick()
    expect(spy).toHaveBeenCalledWith('user4')
    expect(wrapper.text()).toContain('Fourth User')
  })

  it('Should update display when leaderboard changes', async () => {
    const { userResultStore } = setupStores({
      quizzes: [
        { id: 'quiz1', title: 'Quiz', description: '', tags: [], questions: [], published: true },
      ],
      results: [
        {
          id: 'r1',
          userId: 'user5',
          quizId: 'quiz1',
          score: 60,
          maxScore: 100,
          percentage: 60,
          answers: {},
          completedAt: '',
          timeSpent: 1000,
        },
      ],
    })
    getUserByIdMock.mockResolvedValue({
      id: 'user5',
      uid: 'user5',
      name: 'Fifth User',
      email: 'fifth@example.com',
    })
    const wrapper = mount(Leaderboard)
    await flushPromises()
    await nextTick()
    expect(wrapper.text()).toContain('Fifth User')
    // Simulate leaderboard change
    userResultStore.results.push({
      id: 'r2',
      userId: 'user6',
      quizId: 'quiz1',
      score: 90,
      maxScore: 100,
      percentage: 90,
      answers: {},
      completedAt: '',
      timeSpent: 1000,
    })
    getUserByIdMock.mockResolvedValueOnce({
      id: 'user6',
      uid: 'user6',
      name: 'Sixth User',
      email: 'sixth@example.com',
    })
    await flushPromises()
    await nextTick()
    expect(wrapper.text()).toContain('Sixth User')
  })

  it('Should handle missing/insufficient Firestore permissions gracefully', async () => {
    setupStores({
      quizzes: [
        { id: 'quiz1', title: 'Quiz', description: '', tags: [], questions: [], published: true },
      ],
      results: [
        {
          id: 'r1',
          userId: 'user7',
          quizId: 'quiz1',
          score: 30,
          maxScore: 100,
          percentage: 30,
          answers: {},
          completedAt: '',
          timeSpent: 1000,
        },
      ],
    })
    getUserByIdMock.mockRejectedValue(new Error('permission-denied'))
    const wrapper = mount(Leaderboard)
    await flushPromises()
    await nextTick()
    // Should still render userId as fallback
    expect(wrapper.text()).toContain('user7')
  })
})
