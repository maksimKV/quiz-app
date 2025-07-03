import { describe, it, expect } from 'vitest'
import { useQuizAnalytics } from '../../useQuizAnalytics'
import type { Quiz } from '../../../types/quiz'
import type { UserResult } from '../../../types/userResult'

describe('useQuizAnalytics integration', () => {
  const quizzes: Quiz[] = [
    {
      id: 'quiz1',
      title: 'Quiz 1',
      description: '',
      tags: [],
      published: true,
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          content: 'Q1?',
          options: ['A', 'B'],
          correctAnswers: ['A'],
        },
      ],
    },
  ]
  const results: UserResult[] = [
    {
      id: 'r1',
      userId: 'u1',
      quizId: 'quiz1',
      score: 1,
      maxScore: 1,
      percentage: 100,
      answers: { q1: 'A' },
      completedAt: '',
      timeSpent: 1000,
    },
    {
      id: 'r2',
      userId: 'u2',
      quizId: 'quiz1',
      score: 0,
      maxScore: 1,
      percentage: 0,
      answers: { q1: 'B' },
      completedAt: '',
      timeSpent: 2000,
    },
  ]
  const analytics = useQuizAnalytics(quizzes, results)

  it('calculates leaderboard and analytics correctly', () => {
    expect(analytics.attempts('quiz1')).toBe(2)
    expect(analytics.avgScore('quiz1')).toBe('0.50')
    expect(analytics.avgTime('quiz1')).toBe('2s')
    expect(analytics.questionCorrectPct('quiz1', 'q1')).toBe(50)
    expect(analytics.leaderboard.value).toEqual([
      { userId: 'u1', totalScore: 1 },
      { userId: 'u2', totalScore: 0 },
    ])
  })
})
