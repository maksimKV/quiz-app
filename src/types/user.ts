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
    lastDate: string
    longest?: number
  }
}

export interface AdminUser {
  uid: string
  email: string
  displayName?: string
  isAdmin: boolean
}
