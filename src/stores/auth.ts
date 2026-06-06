import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getMe } from '@/lib/api/portal'
import { createAuthProvider } from '@/lib/auth'
import type { MeResponse } from '@/lib/api/types'

const KEY = 'cimp.token'
export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(KEY))
  const currentUser = ref<MeResponse | null>(null)
  const provider = createAuthProvider()
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => currentUser.value?.isAdmin === true)

  function setToken(t: string | null) { token.value = t; if (t) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY) }
  async function hydrateUser() { currentUser.value = await getMe() }
  async function login(employeeId?: string) { setToken(await provider.login(employeeId)); await hydrateUser() }
  function clear() { setToken(null); currentUser.value = null }
  function logout() { clear() }
  return { token, currentUser, isAuthenticated, isAdmin, setToken, hydrateUser, login, clear, logout }
})
