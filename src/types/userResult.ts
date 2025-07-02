export interface UserResult {
  id: string
  userId: string
  quizId: string
  score: number
  answers: Record<string, string[]>
  startedAt: string
  finishedAt: string
} 