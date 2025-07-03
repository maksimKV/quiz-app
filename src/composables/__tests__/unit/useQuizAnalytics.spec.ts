import { describe, it, expect } from 'vitest'
import { useQuizAnalytics } from '../../useQuizAnalytics'
import type { Quiz } from '../../../types/quiz'
import type { UserResult } from '../../../types/userResult'

const quizzes: Quiz[] = [
  {
    id: 'quiz1',
    title: 'Sample Quiz',
    description: 'A test quiz',
    tags: [],
    published: true,
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        content: 'Question 1',
        correctAnswers: ['A'],
        options: ['A', 'B', 'C'],
      },
      {
        id: 'q2',
        type: 'multiple-answer',
        content: 'Question 2',
        correctAnswers: ['B', 'C'],
        options: ['A', 'B', 'C'],
      },
      {
        id: 'q3',
        type: 'short-text',
        content: 'Question 3',
        correctAnswers: ['answer'],
        options: [],
      },
    ],
  },
]

const results: UserResult[] = [
  {
    id: 'r1',
    userId: 'user1',
    quizId: 'quiz1',
    score: 80,
    maxScore: 100,
    percentage: 80,
    answers: {
      q1: 'A',
      q2: ['B', 'C'],
      q3: 'answer',
    },
    completedAt: '2024-01-01T00:00:00Z',
    timeSpent: 30000,
  },
  {
    id: 'r2',
    userId: 'user2',
    quizId: 'quiz1',
    score: 60,
    maxScore: 100,
    percentage: 60,
    answers: {
      q1: 'B',
      q2: ['B'],
      q3: 'wrong',
    },
    completedAt: '2024-01-01T00:01:00Z',
    timeSpent: 60000,
  },
  {
    id: 'r3',
    userId: 'user3',
    quizId: 'quiz1',
    score: 40,
    maxScore: 100,
    percentage: 40,
    answers: {
      q1: 'C',
      q2: ['A', 'B'],
      q3: 'answer',
    },
    completedAt: '2024-01-01T00:02:00Z',
    timeSpent: 90000,
  },
]

describe('useQuizAnalytics', () => {
  const analytics = useQuizAnalytics(quizzes, results)

  it('Should calculate attempts for a quiz', () => {
    expect(analytics.attempts('quiz1')).toBe(3)
  })

  it('Should calculate average score for a quiz', () => {
    expect(analytics.avgScore('quiz1')).toBe('60.00')
  })

  it('Should calculate average time for a quiz', () => {
    expect(analytics.avgTime('quiz1')).toBe('1.0m')
  })

  it('Should calculate question correct percentage', () => {
    expect(analytics.questionCorrectPct('quiz1', 'q1')).toBe(33)
    expect(analytics.questionCorrectPct('quiz1', 'q2')).toBe(33)
    expect(analytics.questionCorrectPct('quiz1', 'q3')).toBe(67)
  })

  it('Should identify the most missed option', () => {
    expect(analytics.mostMissedOption('quiz1', 'q1')).toBe('A')
    expect(analytics.mostMissedOption('quiz1', 'q2')).toBe('C')
  })

  it('Should build the leaderboard with correct user IDs and scores', () => {
    const leaderboard = analytics.leaderboard.value
    expect(leaderboard).toEqual([
      { userId: 'user1', totalScore: 80 },
      { userId: 'user2', totalScore: 60 },
      { userId: 'user3', totalScore: 40 },
    ])
  })
})
