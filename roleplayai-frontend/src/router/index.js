import { createRouter, createWebHistory } from 'vue-router'
import RoleListView from '@/views/RoleListView.vue'
import ChatView from '@/views/ChatView.vue'
import RoleEditView from '@/views/RoleEditView.vue'
import SessionShareView from '@/views/SessionShareView.vue'

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
    },
    {
      path: '/roles/add',
      name: 'role-add',
      component: RoleEditView
    },
    {
      path: '/roles/:id/edit',
      name: 'role-edit',
      component: RoleEditView
    },
    {
      path: '/share/:id',
      name: 'session-share',
      component: SessionShareView
    }
  ]
})

export default router