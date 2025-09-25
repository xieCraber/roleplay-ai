import { createRouter, createWebHistory } from 'vue-router'
import RoleListView from '@/views/RoleListView.vue'
import ChatView from '@/views/ChatView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'role-list',
      component: RoleListView
    },
    {
      path: '/chat/:id',
      name: 'chat',
      component: ChatView
    }
  ]
})

export default router