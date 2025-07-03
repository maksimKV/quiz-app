<script setup>
import { useAuth } from './composables/useAuth'
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const { user, logout } = useAuth()
const router = useRouter()
const isAuthenticated = computed(() => !!user.value)

function handleLogout() {
  logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto">
      <nav
        class="sticky top-0 z-30 flex items-center gap-4 px-8 py-4 bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur rounded-b-xl"
      >
        <router-link
          to="/player"
          class="font-bold text-blue-700 dark:text-blue-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 px-2 py-1 rounded transition"
          >Quiz Player</router-link
        >
        <router-link
          v-if="isAuthenticated"
          to="/leaderboard"
          class="font-bold text-yellow-700 dark:text-yellow-300 hover:underline focus:outline-none focus:ring-2 focus:ring-yellow-400 px-2 py-1 rounded transition"
          >Leaderboard</router-link
        >
        <router-link
          to="/admin"
          class="font-bold text-purple-700 dark:text-purple-300 hover:underline focus:outline-none focus:ring-2 focus:ring-purple-400 px-2 py-1 rounded transition"
          >Admin Panel</router-link
        >
        <router-link
          to="/profile"
          class="font-bold text-green-700 dark:text-green-300 hover:underline focus:outline-none focus:ring-2 focus:ring-green-400 px-2 py-1 rounded transition"
          >Profile</router-link
        >
        <div class="flex-1"></div>
        <router-link
          v-if="!isAuthenticated"
          to="/login"
          class="font-bold text-gray-700 dark:text-gray-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 px-3 py-1 rounded transition"
          >Login</router-link
        >
        <router-link
          v-if="!isAuthenticated"
          to="/register"
          class="font-bold text-gray-700 dark:text-gray-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 px-3 py-1 rounded transition"
          >Register</router-link
        >
        <button
          v-else
          class="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition ml-4"
          @click="handleLogout"
        >
          Logout
        </button>
      </nav>
    </div>
    <main class="max-w-6xl mx-auto p-4 md:p-8">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
