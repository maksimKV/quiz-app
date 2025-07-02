export interface User {
  id: string
  uid: string
  name: string
  email: string
  isAdmin: boolean
  xp?: number
  badges?: string[]
  streak?: {
    count: number
    lastDate: string // ISO date string
    longest?: number
  }
} 