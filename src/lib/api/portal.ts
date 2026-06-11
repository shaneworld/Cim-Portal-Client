import { request } from './client'
import type { HomeResponse, MeResponse } from './types'
import type { Announcement } from './announcements'

export const getHome = () => request<HomeResponse>('GET', '/api/portal/home')
export const getMe = () => request<MeResponse>('GET', '/api/portal/me')
export const listAnnouncements = () => request<Announcement[]>('GET', '/api/portal/announcements')

export interface PortalConfig {
  ssoEnabled: boolean
  authority?: string
  clientId?: string
  scopes: string
  usernameClaim: string
  /** Added in block B — undefined until backend delivers it; treated as false */
  announcementsEnabled?: boolean
  /** Added in block C — undefined until backend delivers it; treated as false */
  dutyLinesEnabled?: boolean
}

export const getConfig = () => request<PortalConfig>('GET', '/api/portal/config')

export const internalLogin = (employeeId: string, password: string) =>
  request<{ access_token: string; token_type: string }>('POST', '/api/auth/login', { employeeId, password })
