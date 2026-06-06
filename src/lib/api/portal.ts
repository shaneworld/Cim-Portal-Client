import { request } from './client'
import type { HomeResponse, MeResponse } from './types'

export const getHome = () => request<HomeResponse>('GET', '/api/portal/home')
export const getMe = () => request<MeResponse>('GET', '/api/portal/me')
