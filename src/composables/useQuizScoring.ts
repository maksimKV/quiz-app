import type { Question } from '../types/quiz'

export function useQuizScoring() {
  function calculateQuestionScore(question: Question, answer: any): number {
    if (question.type === 'multiple-choice') {
      return answer === question.correctAnswers[0] ? 1 : 0
    } else if (question.type === 'multiple-answer') {
      const userAns = Array.isArray(answer) ? answer : []
      const correct = question.correctAnswers
      const totalCorrect = correct.length
      const totalOptions = question.options?.length || 0
      const numCorrectSelected = userAns.filter((a: string) => correct.includes(a)).length
      const numIncorrectSelected = userAns.filter((a: string) => !correct.includes(a)).length
      let partial = 0
      if (totalCorrect > 0 && totalOptions > 0) {
        partial = (numCorrectSelected / totalCorrect) - (numIncorrectSelected / totalOptions)
        if (partial < 0) partial = 0
      }
      return Number(partial.toFixed(2))
    } else if (question.type === 'short-text') {
      return (answer || '').trim().toLowerCase() === (question.correctAnswers[0] || '').trim().toLowerCase() ? 1 : 0
    }
    return 0
  }

  function getPartialExplanation(question: Question, answer: any): string {
    if (question.type === 'multiple-answer') {
      const userAns = Array.isArray(answer) ? answer : []
      const correct = question.correctAnswers
      const missed = correct.filter(a => !userAns.includes(a))
      const incorrect = userAns.filter(a => !correct.includes(a))
      if (missed.length === 0 && incorrect.length === 0) return ''
      let msg = ''
      if (missed.length > 0) msg += `Missed correct: ${missed.join(', ')}. `
      if (incorrect.length > 0) msg += `Incorrectly selected: ${incorrect.join(', ')}.`
      return msg.trim()
    }
    return ''
  }

  function getScoreClass(score: number, question: Question): string {
    if (question.type === 'multiple-answer' && score > 0 && score < 1) return 'text-yellow-600 font-bold'
    if (score >= 1) return 'text-green-700 font-bold'
    if (score === 0) return 'text-red-600 font-bold'
    return ''
  }

  function getOptionClass(question: Question, option: string, isSelected: boolean, showReview: boolean): string {
    if (showReview) {
      if (question.correctAnswers.includes(option) && isSelected) return 'text-green-700 font-bold'
      if (!question.correctAnswers.includes(option) && isSelected) return 'text-red-600 font-bold'
      if (question.correctAnswers.includes(option)) return 'text-green-700'
    }
    return ''
  }

  return {
    calculateQuestionScore,
    getPartialExplanation,
    getScoreClass,
    getOptionClass
  }
} 