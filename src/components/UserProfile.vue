<template>
  <div
    class="max-w-md mx-auto p-8 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl mt-16 border border-gray-200 dark:border-gray-700"
  >
    <h2 class="text-2xl font-extrabold mb-6 text-center text-green-700 dark:text-green-300">
      Your Profile
    </h2>
    <div class="flex gap-2 justify-end mb-4">
      <router-link
        to="/leaderboard"
        class="px-3 py-1 bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-sm"
        >View Leaderboard</router-link
      >
      <button
        class="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded shadow hover:bg-gray-400 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition text-sm"
        @click="shareProfile"
      >
        Share
      </button>
    </div>
    <div v-if="mergedUser" class="mb-6 flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <span class="font-bold text-lg">Level:</span>
        <span class="text-purple-700 dark:text-purple-300 font-mono text-lg">
          {{ mergedUser.level }}
        </span>
        <span class="font-bold text-lg">XP:</span>
        <span class="text-blue-700 dark:text-blue-300 font-mono text-lg">
          {{ mergedUser.animatedXP }}
        </span>
        <div class="flex-1 h-2 bg-gray-200 rounded mx-2">
          <div
            class="h-2 bg-blue-500 rounded transition-all duration-700"
            :style="{ width: mergedUser.xpPercent + '%' }"
          ></div>
        </div>
        <span class="text-green-700 dark:text-green-300 font-mono text-lg">
          {{ mergedUser.xpToNextLevel }} XP to next level
        </span>
      </div>
      <div class="flex items-center gap-3">
        <span class="font-bold text-lg">Streak:</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          :class="['h-6 w-6 text-orange-500', mergedUser.streak?.count >= 3 ? 'animate-pulse' : '']"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 3v2m0 0C7.03 5 3 9.03 3 14c0 3.87 3.13 7 7 7s7-3.13 7-7c0-4.97-4.03-9-9-9z"
          />
        </svg>
        <span class="text-orange-600 font-mono text-lg">
          {{ mergedUser.streak?.count || 0 }} days
        </span>
      </div>
      <div
        v-if="mergedUser.streak?.longest"
        class="flex items-center gap-2 text-xs text-orange-400 ml-8"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 text-orange-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 3v2m0 0C7.03 5 3 9.03 3 14c0 3.87 3.13 7 7 7s7-3.13 7-7c0-4.97-4.03-9-9-9z"
          />
        </svg>
        Longest streak: {{ mergedUser.streak?.longest || 0 }} days
      </div>
      <div class="flex items-center gap-3">
        <span class="font-bold text-lg">Badges:</span>
        <div class="flex gap-2 flex-wrap">
          <div
            v-for="badge in ['first-quiz', 'quiz-master', 'streak-starter', 'dedicated']"
            :key="badge"
            class="flex items-center gap-2"
          >
            <div
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center',
                mergedUser.badges.includes(badge)
                  ? 'bg-yellow-400 text-yellow-900'
                  : 'bg-gray-200 text-gray-500',
              ]"
            >
              <StarIcon v-if="badge === 'first-quiz' || badge === 'quiz-master'" class="w-4 h-4" />
              <FireIcon v-else class="w-4 h-4" />
            </div>
            <span class="text-sm">{{ badgeLabel(badge) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="mb-4">
      <label class="block font-semibold mb-1 text-gray-700 dark:text-gray-200">Name</label>
      <input v-model="name" type="text" class="input focus:ring-2 focus:ring-green-400" />
    </div>
    <div class="mb-4">
      <label class="block font-semibold mb-1 text-gray-700 dark:text-gray-200">Email</label>
      <input :value="mergedUser?.email" type="email" class="input" disabled />
    </div>
    <div class="mb-4">
      <label class="block font-semibold mb-1 text-gray-700 dark:text-gray-200">New Password</label>
      <input
        v-model="password"
        type="password"
        class="input focus:ring-2 focus:ring-green-400"
        placeholder="Leave blank to keep current"
      />
    </div>
    <div class="flex gap-2 mt-6 items-center">
      <button
        class="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
        @click="save"
      >
        Save
      </button>
      <span v-if="success" class="text-green-600 text-sm mt-2">Profile updated!</span>
      <span v-if="error" class="text-red-600 text-sm mt-2">{{ error }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import { StarIcon, FireIcon } from '@heroicons/vue/24/solid'
import { useToast } from 'vue-toastification'

const { user } = useAuth()
const name = ref(user.value?.displayName || '')
const password = ref('')
const error = ref('')
const success = ref(false)

const LEVEL_XP = 1000

interface ExtendedUser {
  xp?: number
  badges?: string[]
  streak?: { count: number; lastDate: string; longest?: number }
  email?: string
  displayName?: string
}

interface MergedUser {
  level: number
  xpToNextLevel: number
  xpPercent: number
  animatedXP: number
  streak?: { count: number; lastDate: string; longest?: number }
  badges: string[]
  xp: number
  email: string
  name: string
}

const mergedUser = computed<MergedUser>(() => {
  const userData = (user.value as ExtendedUser) || {
    xp: 0,
    badges: [],
    streak: undefined,
    email: '',
    displayName: '',
  }
  const level = Math.floor((userData.xp || 0) / LEVEL_XP) + 1
  const xpToNextLevel = LEVEL_XP - ((userData.xp || 0) % LEVEL_XP)
  const xpPercent = Math.min(100, (((userData.xp || 0) % LEVEL_XP) / LEVEL_XP) * 100)

  return {
    level,
    xpToNextLevel,
    xpPercent,
    animatedXP: userData.xp || 0,
    streak: userData.streak,
    badges: userData.badges || [],
    xp: userData.xp || 0,
    email: userData.email || '',
    name: userData.displayName || '',
  }
})

function badgeLabel(badge: string): string {
  switch (badge) {
    case 'first-quiz':
      return 'First Quiz'
    case 'quiz-master':
      return 'Quiz Master'
    case 'streak-starter':
      return 'Streak Starter'
    case 'dedicated':
      return 'Dedicated'
    default:
      return badge
  }
}

const toast = useToast()

function shareProfile() {
  if (!user.value) return
  const badgeLabels =
    ((user.value as ExtendedUser).badges || []).map(badgeLabel).join(', ') || 'No badges yet'
  const text = `My Quiz App Profile:\nLevel: ${mergedUser.value.level}\nXP: ${mergedUser.value.xp}\nStreak: ${mergedUser.value.streak?.count || 0} days\nBadges: ${badgeLabels}`
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success('Profile summary copied!'))
    .catch(() => toast.error('Failed to copy profile.'))
}

function save() {
  // Implementation of save function
}
</script>

<style scoped>
/* Add your styles here */
</style>
