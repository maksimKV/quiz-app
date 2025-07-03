import { computed } from 'vue'
import type { Quiz } from '../types/quiz'
import type { UserResult } from '../types/userResult'

export function useQuizAnalytics(quizzes: Quiz[], results: UserResult[]) {
  function attempts(quizId: string) {
    return results.filter(r => r.quizId === quizId).length
  }

  function avgScore(quizId: string) {
    const quizResults = results.filter(r => r.quizId === quizId)
    if (!quizResults.length) return 0
    const sum = quizResults.reduce((acc, r) => acc + r.score, 0)
    return (sum / quizResults.length).toFixed(2)
  }

  function avgTime(quizId: string) {
    const quizResults = results.filter(r => r.quizId === quizId)
    if (!quizResults.length) return '0s'
    const sum = quizResults.reduce((acc, r) => acc + (r.timeSpent || 0), 0)
    const avgMs = sum / quizResults.length
    if (avgMs < 1000) return '<1s'
    if (avgMs < 60000) return Math.round(avgMs / 1000) + 's'
    return (avgMs / 60000).toFixed(1) + 'm'
  }

  function questionCorrectPct(quizId: string, questionId: string) {
    const quiz = quizzes.find(q => q.id === quizId)
    if (!quiz) return 0
    const q = quiz.questions.find(q => q.id === questionId)
    if (!q) return 0
    const quizResults = results.filter(r => r.quizId === quizId)
    if (!quizResults.length) return 0
    let correct = 0
    quizResults.forEach(r => {
      if (q.type === 'multiple-choice') {
        if (
          typeof r.answers[questionId] === 'string' &&
          r.answers[questionId] === q.correctAnswers[0]
        )
          correct++
      } else if (q.type === 'multiple-answer') {
        const userAns = Array.isArray(r.answers[questionId]) ? r.answers[questionId] : []
        const correctSet = new Set(q.correctAnswers)
        if (
          userAns.length &&
          userAns.every((a: string) => correctSet.has(a)) &&
          userAns.length === q.correctAnswers.length
        )
          correct++
      } else if (q.type === 'short-text') {
        const ans = typeof r.answers[questionId] === 'string' ? r.answers[questionId] : ''
        if (ans.trim().toLowerCase() === (q.correctAnswers[0] || '').trim().toLowerCase()) correct++
      }
    })
    return Math.round((correct / quizResults.length) * 100)
  }

  function mostMissedOption(quizId: string, questionId: string) {
    const quiz = quizzes.find(qz => qz.id === quizId)
    if (!quiz) return ''
    const question = quiz.questions.find(qq => qq.id === questionId)
    if (!question || !question.options) return ''
    const quizResults = results.filter(r => r.quizId === quizId)
    if (!quizResults.length) return ''
    const missCounts: Record<string, number> = {}
    const options: string[] = question.options
    options.forEach((opt: string) => {
      missCounts[opt] = 0
    })
    quizResults.forEach(r => {
      if (question.type === 'multiple-choice' || question.type === 'multiple-answer') {
        const userAns =
          question.type === 'multiple-answer'
            ? Array.isArray(r.answers[questionId])
              ? r.answers[questionId]
              : []
            : typeof r.answers[questionId] === 'string'
              ? [r.answers[questionId]]
              : []
        options.forEach((opt: string) => {
          if (!userAns.includes(opt) && question.correctAnswers.includes(opt)) missCounts[opt]++
        })
      }
    })
    const mostMissed = Object.entries(missCounts).sort((a, b) => b[1] - a[1])[0]
    return mostMissed && mostMissed[1] > 0 ? mostMissed[0] : ''
  }

  const leaderboard = computed(() => {
    const userScores: Record<string, number> = {}
    results.forEach(r => {
      userScores[r.userId] = (userScores[r.userId] || 0) + r.score
    })
    const leaderboardArr = Object.entries(userScores)
      .map(([userId, totalScore]) => ({ userId, totalScore }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10)
    return leaderboardArr
  })

  return {
    attempts,
    avgScore,
    avgTime,
    questionCorrectPct,
    mostMissedOption,
    leaderboard,
  }
}
