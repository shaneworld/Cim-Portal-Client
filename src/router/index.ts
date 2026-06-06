import { createRouter, createWebHistory } from 'vue-router'
import type { Router, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('@/features/auth/LoginView.vue'), meta: { public: true } },
  { path: '/account-inactive', name: 'account-inactive', component: () => import('@/features/auth/AccountInactiveView.vue'), meta: { public: true } },
  { path: '/', name: 'home', component: () => import('@/features/dashboard/HomeView.vue') },
  {
    path: '/admin',
    component: () => import('@/features/admin/AdminLayout.vue'),
    meta: { admin: true },
    children: [
      { path: '', redirect: '/admin/links' },
      { path: 'links', name: 'admin-links', component: () => import('@/features/admin/links/LinksAdminView.vue') },
    ],
  },
]

export function installGuards(router: Router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    if (to.meta.public) return true
    if (!auth.isAuthenticated) return { path: '/login' }
    if (!auth.currentUser) {
      try { await auth.hydrateUser() } catch { auth.clear(); return { path: '/login' } }
    }
    if (to.meta.admin && !auth.isAdmin) return { path: '/' }
    return true
  })
}

export function createAppRouter() {
  const r = createRouter({ history: createWebHistory(), routes })
  installGuards(r)
  return r
}
