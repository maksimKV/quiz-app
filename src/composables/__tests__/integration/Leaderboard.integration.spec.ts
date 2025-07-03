import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Leaderboard from '../../../views/Leaderboard.vue'
import { setActivePinia, createPinia } from 'pinia'
import { useQuizStore } from '../../../store/quiz'
import { useUserResultStore } from '../../../store/userResult'
import { nextTick } from 'vue'
import type { Quiz } from '../../../types/quiz'
import type { UserResult } from '../../../types/userResult'

vi.mock('../../../services/userService', () => ({
  userService: {
    getUserById: vi.fn(),
  },
}))
import { userService } from '../../../services/userService'
const getUserByIdMock = userService.getUserById as ReturnType<typeof vi.fn>

vi.mock('../../../composables/useAuth', () => ({
  useAuth: () => ({
    user: { value: { uid: 'user1', displayName: 'Test User', email: 'test@example.com' } },
  }),
}))

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

describe('Leaderboard.vue Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays correct user names and scores after quiz results are submitted', async () => {
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
      if (uid === 'user1')
        return { id: 'user1', uid: 'user1', name: 'Test User', email: 'test@example.com' }
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

  it('handles real-time updates to leaderboard', async () => {
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
})
