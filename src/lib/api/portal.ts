import { request } from './client'
import type { HomeResponse, MeResponse } from './types'
import type { Announcement } from './announcements'
import type { DutyLine } from './dutyLines'

export const getHome = () => request<HomeResponse>('GET', '/api/portal/home')
export const toggleFavorite = (linkId: number, on: boolean) =>
  request<void>(on ? 'POST' : 'DELETE', '/api/portal/favorites/' + linkId)
export const getMe = () => request<MeResponse>('GET', '/api/portal/me')
export const listAnnouncements = () => request<Announcement[]>('GET', '/api/portal/announcements')
export const listDutyLines = () => request<DutyLine[]>('GET', '/api/portal/duty-lines')

export interface PortalConfig {
  ssoEnabled: boolean
  authority?: string
  clientId?: string
  scopes: string
  usernameClaim: string
  /** Info panel (announcements + duty lines) toggle */
  infoPanelEnabled?: boolean
}

export const getConfig = () => request<PortalConfig>('GET', '/api/portal/config')

export const internalLogin = (employeeId: string, password: string) =>
  request<{ access_token: string; token_type: string }>('POST', '/api/auth/login', { employeeId, password })
