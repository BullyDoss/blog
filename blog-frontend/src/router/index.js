import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import PostView from '@/views/PostView.vue'
import NotesView from '@/views/NotesView.vue'
import BrainstormView from '@/views/BrainstormView.vue'
import ChatView from '@/views/ChatView.vue'
import SubmitZoneView from '@/views/SubmitZoneView.vue'
import SubmitView from '@/views/SubmitView.vue'
import AdminLogin from '@/views/AdminLogin.vue'
import AdminDashboard from '@/views/AdminDashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/notes' },
    {
      path: '/notes',
      name: 'notes',
      component: NotesView,
    },
    {
      path: '/notes/:slug',
      name: 'notes-detail',
      component: NotesView,
    },
    {
      path: '/brainstorm',
      name: 'brainstorm',
      component: BrainstormView,
    },
    {
      path: '/brainstorm/:slug',
      name: 'brainstorm-detail',
      component: BrainstormView,
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatView,
    },
    {
      path: '/chat/:slug',
      name: 'chat-detail',
      component: ChatView,
    },
    {
      path: '/daily',
      name: 'submit-zone',
      component: SubmitZoneView,
    },
    {
      path: '/daily/:slug',
      name: 'submit-zone-detail',
      component: SubmitZoneView,
    },
    {
      path: '/submit',
      name: 'submit',
      component: SubmitView,
    },
    // 兼容旧路由
    { path: '/post/:slug', name: 'post', component: PostView },
    { path: '/home', name: 'home', component: HomeView },
    { path: '/admin/login', name: 'admin-login', component: AdminLogin },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: AdminDashboard,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('adminToken')
  if (to.meta.requiresAuth && !token) {
    next('/admin/login')
  } else if (to.path === '/admin/login' && token) {
    next('/admin')
  } else {
    next()
  }
})

export default router
