import { userService } from '../services/userService'
import { useToast } from 'vue-toastification'

export interface GamificationInput {
  userId: string
  score: number
  maxScore: number
  completedAt: string // ISO date string
}

// Badge definitions
const BADGES = [
  { id: 'first-quiz', label: 'First Quiz', icon: 'StarIcon', criteria: (stats: any) => stats.totalQuizzes === 1 },
  { id: 'quiz-master', label: 'Quiz Master', icon: 'TrophyIcon', criteria: (stats: any) => stats.perfectScores >= 5 },
  { id: 'streak-starter', label: 'Streak Starter', icon: 'FireIcon', criteria: (stats: any) => stats.streak >= 3 },
  { id: 'dedicated', label: 'Dedicated', icon: 'FireIcon', criteria: (stats: any) => stats.streak >= 7 },
]

// Explicitly type toast
let toast: ReturnType<typeof useToast> | undefined = undefined;
if (typeof window !== 'undefined') {
  toast = useToast();
}

export async function updateGamification({ userId, score, maxScore, completedAt }: GamificationInput) {
  // 1. Fetch user
  const user = await userService.getUserById(userId)
  if (!user) return

  // 2. XP: +10 per correct answer, +50 for quiz completion
  const correct = Math.round(score)
  const xpEarned = correct * 10 + 50
  const prevXP = user.xp || 0
  const newXP = prevXP + xpEarned
  await userService.updateXP(userId, newXP)

  // Level up toast
  const prevLevel = Math.floor(prevXP / 1000) + 1
  const newLevel = Math.floor(newXP / 1000) + 1
  if (toast && newLevel > prevLevel) {
    toast.success(`🎉 Level Up! You reached Level ${newLevel}!`)
  }

  // 3. Streak: increment if lastDate is yesterday, else reset to 1
  const today = new Date(completedAt).toISOString().slice(0, 10)
  let streak = user.streak?.count || 0
  let lastDate = user.streak?.lastDate || ''
  let longest = user.streak?.longest || 0
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (lastDate === today) {
    // Already counted today
  } else if (lastDate === yesterday) {
    streak++
  } else {
    streak = 1
  }
  if (streak > longest) longest = streak
  await userService.updateStreak(userId, streak, today)
  await userService.setUserFields(userId, { streak: { count: streak, lastDate: today, longest } })

  // 4. Badges: check criteria
  // Gather stats
  // For simplicity, fetch all user results and count
  // (In production, optimize this with a stats doc or cache)
  const { userResultService } = await import('../services/userResultService')
  const results = await userResultService.getResultsByUser(userId)
  const totalQuizzes = results.length
  const perfectScores = results.filter((r: any) => r.score === r.maxScore).length
  const stats = { totalQuizzes, perfectScores, streak }
  for (const badge of BADGES) {
    if (badge.criteria(stats) && !(user.badges || []).includes(badge.id)) {
      await userService.addBadge(userId, badge.id)
      if (toast) toast.info(`🏅 Badge Unlocked: ${badge.label}`)
    }
  }
} 