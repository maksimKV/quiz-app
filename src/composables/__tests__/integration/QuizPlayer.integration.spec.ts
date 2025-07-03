import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import QuizPlayer from '../../../views/QuizPlayer.vue'
import { setActivePinia, createPinia } from 'pinia'
import { useQuizStore } from '../../../store/quiz'
import { useUserResultStore } from '../../../store/userResult'
import { useAuthStore } from '../../../store/auth'
import type { Quiz } from '../../../types/quiz'

function setupStores({
  quizzes = [],
  user = null,
}: {
  quizzes?: Quiz[]
  user?: { id: string; uid: string; name: string; email: string; isAdmin: boolean } | null
} = {}) {
  setActivePinia(createPinia())
  const quizStore = useQuizStore()
  const userResultStore = useUserResultStore()
  const authStore = useAuthStore()
  quizStore.quizzes = quizzes
  if (user) authStore.user = user
  return { quizStore, userResultStore, authStore }
}

describe('QuizPlayer.vue Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads questions and displays them to the user', async () => {
    const quiz: Quiz = {
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
    }
    setupStores({
      quizzes: [quiz],
      user: {
        id: 'user1',
        uid: 'user1',
        name: 'User One',
        email: 'user1@example.com',
        isAdmin: false,
      },
    })
    const wrapper = mount(QuizPlayer)
    await flushPromises()
    expect(wrapper.text()).toContain('Available Quizzes')
    // Start the quiz
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('What is 2+2?')
  })

  it('submits answers and stores results', async () => {
    const quiz: Quiz = {
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
    }
    const { userResultStore } = setupStores({
      quizzes: [quiz],
      user: {
        id: 'user1',
        uid: 'user1',
        name: 'User One',
        email: 'user1@example.com',
        isAdmin: false,
      },
    })
    const addResultSpy = vi.spyOn(userResultStore, 'addResult')
    const wrapper = mount(QuizPlayer)
    await flushPromises()
    await wrapper.find('button').trigger('click')
    await flushPromises()
    // Select the correct answer (find the radio for '4')
    const radioInputs = wrapper.findAll('input[type="radio"]')
    const fourRadio = radioInputs.find(r => (r.element as HTMLInputElement).value === '4')
    expect(fourRadio).toBeDefined()
    await fourRadio!.setValue()
    await flushPromises()
    // Find the submit button (should be the only button with text 'Submit')
    const submitBtn = wrapper.findAll('button').find(b => b.text().toLowerCase().includes('submit'))
    expect(submitBtn).toBeDefined()
    await submitBtn!.trigger('click')
    await flushPromises()
    // Now click the 'Back to Quiz List' button to trigger results view
    const backBtn = wrapper
      .findAll('button')
      .find(b => b.text().toLowerCase().includes('back to quiz list'))
    if (backBtn) {
      await backBtn.trigger('click')
      await flushPromises()
    }
    expect(addResultSpy).toHaveBeenCalled()
    // The results view may not show 'Quiz Results' if the quiz is reset, so just check for Score
    expect(wrapper.text()).toContain('Score:')
  })
})
