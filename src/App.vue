<script setup>
import HelloWorld from './components/HelloWorld.vue'
import TheWelcome from './components/TheWelcome.vue'
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
  <div>
    <nav class="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <router-link to="/player" class="font-bold text-blue-700 dark:text-blue-300">Quiz Player</router-link>
      <router-link to="/admin" class="font-bold text-purple-700 dark:text-purple-300">Admin Panel</router-link>
      <router-link to="/profile" class="font-bold text-green-700 dark:text-green-300">Profile</router-link>
      <router-link v-if="!isAuthenticated" to="/login" class="ml-auto font-bold text-gray-700 dark:text-gray-300">Login</router-link>
      <router-link v-if="!isAuthenticated" to="/register" class="font-bold text-gray-700 dark:text-gray-300">Register</router-link>
      <button v-else class="ml-auto px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700" @click="handleLogout">Logout</button>
    </nav>
    <router-view />
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
