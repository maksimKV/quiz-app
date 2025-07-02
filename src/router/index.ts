import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/admin',
    name: 'AdminPanel',
    component: () => import('../views/AdminPanel.vue'),
  },
  {
    path: '/player',
    name: 'QuizPlayer',
    component: () => import('../views/QuizPlayer.vue'),
  },
  {
    path: '/',
    redirect: '/player',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
}) 