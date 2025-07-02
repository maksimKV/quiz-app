export interface UserResult {
  id: string
  userId: string
  quizId: string
  score: number
  maxScore: number
  percentage: number
  answers: Record<string, any>
  completedAt: string
  timeSpent?: number
} 