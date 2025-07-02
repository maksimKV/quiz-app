<template>
  <div class="max-w-md mx-auto p-8 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl mt-16 border border-gray-200 dark:border-gray-700">
    <h2 class="text-2xl font-extrabold mb-6 text-center text-green-700 dark:text-green-300">Your Profile</h2>
    <div v-if="levelUpMsg" class="mb-4 p-3 bg-yellow-200 text-yellow-900 rounded-lg text-center font-bold border border-yellow-400 shadow animate-bounce">{{ levelUpMsg }}</div>
    <div class="flex gap-2 justify-end mb-4">
      <router-link to="/leaderboard" class="px-3 py-1 bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-sm">View Leaderboard</router-link>
      <button @click="shareProfile" class="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded shadow hover:bg-gray-400 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition text-sm">Share</button>
    </div>
    <div v-if="user" class="mb-6 flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <span class="font-bold text-lg">Level:</span>
        <span class="text-purple-700 dark:text-purple-300 font-mono text-lg">{{ userLevel }}</span>
        <span class="font-bold text-lg">XP:</span>
        <span class="text-blue-700 dark:text-blue-300 font-mono text-lg">{{ animatedXP }}</span>
        <div class="flex-1 h-2 bg-gray-200 rounded mx-2">
          <div class="h-2 bg-blue-500 rounded transition-all duration-700" :style="{ width: xpPercent + '%' }"></div>
        </div>
        <span class="text-xs text-gray-500 ml-2">{{ xpToNextLevel }} XP to next level</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="font-bold text-lg">Streak:</span>
        <svg xmlns="http://www.w3.org/2000/svg" :class="['h-6 w-6 text-orange-500', user.streak?.count >= 3 ? 'animate-pulse' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2m0 0C7.03 5 3 9.03 3 14c0 3.87 3.13 7 7 7s7-3.13 7-7c0-4.97-4.03-9-9-9z" /></svg>
        <span class="text-orange-600 font-mono text-lg">{{ user.streak?.count || 0 }} days</span>
      </div>
      <div v-if="user.streak?.longest" class="flex items-center gap-2 text-xs text-orange-400 ml-8">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2m0 0C7.03 5 3 9.03 3 14c0 3.87 3.13 7 7 7s7-3.13 7-7c0-4.97-4.03-9-9-9z" /></svg>
        Longest streak: {{ user.streak.longest }} days
      </div>
      <div class="flex items-center gap-3">
        <span class="font-bold text-lg">Badges:</span>
        <div class="flex gap-2 flex-wrap">
          <span v-for="badge in ALL_BADGES" :key="badge.id" class="relative group">
            <component :is="badge.icon" :class="[ 'h-7 w-7 inline', user.badges && user.badges.includes(badge.id) ? 'text-yellow-500' : 'text-gray-400 opacity-40' ]" />
            <span class="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 min-w-max text-center">
              <span class="font-bold">{{ badge.label }}</span><br />
              <span>{{ badge.description }}</span>
              <span v-if="!(user.badges && user.badges.includes(badge.id))" class="block mt-1 text-red-300">Locked</span>
            </span>
          </span>
        </div>
      </div>
    </div>
    <div class="mb-4">
      <label class="block font-semibold mb-1 text-gray-700 dark:text-gray-200">Name</label>
      <input v-model="name" type="text" class="input focus:ring-2 focus:ring-green-400" />
    </div>
    <div class="mb-4">
      <label class="block font-semibold mb-1 text-gray-700 dark:text-gray-200">Email</label>
      <input :value="user?.email" type="email" class="input" disabled />
    </div>
    <div class="mb-4">
      <label class="block font-semibold mb-1 text-gray-700 dark:text-gray-200">New Password</label>
      <input v-model="password" type="password" class="input focus:ring-2 focus:ring-green-400" placeholder="Leave blank to keep current" />
    </div>
    <div class="flex gap-2 mt-6 items-center">
      <button class="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition" @click="save">Save</button>
      <span v-if="success" class="text-green-600 text-sm mt-2">Profile updated!</span>
      <span v-if="error" class="text-red-600 text-sm mt-2">{{ error }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useAuth } from '../composables/useAuth'
import { updateProfile, updatePassword } from 'firebase/auth'
import { db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { StarIcon, TrophyIcon, FireIcon } from '@heroicons/vue/24/solid'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'

const { user } = useAuth()
const name = ref(user.value?.displayName || '')
const password = ref('')
const error = ref('')
const success = ref(false)

const LEVEL_XP = 1000
const userLevel = computed(() => Math.floor((user.value?.xp || 0) / LEVEL_XP) + 1)
const xpToNextLevel = computed(() => LEVEL_XP - ((user.value?.xp || 0) % LEVEL_XP))
const xpPercent = computed(() => Math.min(100, ((user.value?.xp || 0) % LEVEL_XP) / LEVEL_XP * 100))

// Animate XP gain
const animatedXP = ref(user.value?.xp || 0)
watch(() => user.value?.xp, (newXP, oldXP) => {
  if (typeof newXP === 'number' && typeof oldXP === 'number') {
    const step = (newXP - oldXP) / 20
    let current = oldXP
    let count = 0
    const interval = setInterval(() => {
      current += step
      animatedXP.value = Math.round(current)
      count++
      if (count >= 20) {
        animatedXP.value = newXP
        clearInterval(interval)
      }
    }, 20)
  } else {
    animatedXP.value = newXP || 0
  }
})

// Level-up notification
const lastLevel = ref(userLevel.value)
const levelUpMsg = ref('')
watch(userLevel, (newLevel, oldLevel) => {
  if (newLevel > oldLevel) {
    levelUpMsg.value = `🎉 Level Up! You reached Level ${newLevel}!`
    setTimeout(() => { levelUpMsg.value = '' }, 3000)
  }
  lastLevel.value = newLevel
})

const ALL_BADGES = [
  { id: 'first-quiz', label: 'First Quiz', icon: StarIcon, description: 'Complete your first quiz.' },
  { id: 'quiz-master', label: 'Quiz Master', icon: TrophyIcon, description: 'Score 100% on 5 quizzes.' },
  { id: 'streak-starter', label: 'Streak Starter', icon: FireIcon, description: 'Get a 3-day streak.' },
  { id: 'dedicated', label: 'Dedicated', icon: FireIcon, description: 'Get a 7-day streak.' },
]

function badgeIcon(badge: string) {
  switch (badge) {
    case 'first-quiz': return StarIcon
    case 'quiz-master': return TrophyIcon
    case 'streak-starter': return FireIcon
    case 'dedicated': return FireIcon
    default: return StarIcon
  }
}

function badgeLabel(badge: string) {
  switch (badge) {
    case 'first-quiz': return 'First Quiz'
    case 'quiz-master': return 'Quiz Master'
    case 'streak-starter': return 'Streak Starter'
    case 'dedicated': return 'Dedicated'
    default: return badge
  }
}

const toast = useToast()
const router = useRouter()

function shareProfile() {
  if (!user.value) return
  const badgeLabels = (user.value.badges || []).map(badgeLabel).join(', ') || 'No badges yet'
  const text = `My Quiz App Profile:\nLevel: ${userLevel.value}\nXP: ${user.value.xp || 0}\nStreak: ${user.value.streak?.count || 0} days\nBadges: ${badgeLabels}`
  navigator.clipboard.writeText(text)
    .then(() => toast.success('Profile summary copied!'))
    .catch(() => toast.error('Failed to copy profile.'))
}

onMounted(async () => {
  if (user.value) {
    try {
      const docRef = doc(db, 'users', user.value.uid)
      const snap = await getDoc(docRef)
      if (snap.exists()) {
        const data = snap.data()
        if (data && data.name) name.value = data.name
      }
    } catch (e: any) {
      error.value = 'Failed to load profile from database.'
    }
  }
})

async function save() {
  error.value = ''
  success.value = false
  try {
    if (user.value && name.value && name.value !== user.value.displayName) {
      await updateProfile(user.value, { displayName: name.value })
      // Save to Firestore
      const docRef = doc(db, 'users', user.value.uid)
      await setDoc(docRef, { name: name.value, email: user.value.email, isAdmin: !!(user.value as any).isAdmin }, { merge: true })
    }
    if (user.value && password.value) {
      await updatePassword(user.value, password.value)
    }
    success.value = true
    password.value = ''
  } catch (e: any) {
    error.value = e.message || 'Failed to update profile.'
  }
}
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700;
}
</style> 