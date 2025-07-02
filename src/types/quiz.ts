export type QuestionType = 'multiple-choice' | 'multiple-answer' | 'short-text'

export interface Question {
  id: string
  type: QuestionType
  content: string
  options?: string[]
  correctAnswers: string[]
  explanation?: string
}

export interface Quiz {
  id: string
  title: string
  description: string
  tags: string[]
  published: boolean
  questions: Question[]
  timer?: number // seconds, optional
} 