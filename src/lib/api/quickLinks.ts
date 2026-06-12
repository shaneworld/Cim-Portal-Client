import { request } from './client'

export interface QuickLink {
  id: number
  labelZh: string
  labelEn: string
  url: string
  icon?: string | null
  sortOrder: number
  active: boolean
}

export interface QuickLinkInput {
  labelZh: string
  labelEn: string
  url: string
  icon?: string | null
  sortOrder: number
  active: boolean
}

export const listAdminQuickLinks = () =>
  request<QuickLink[]>('GET', '/api/admin/quick-links')

export const getAdminQuickLink = (id: number) =>
  request<QuickLink>('GET', `/api/admin/quick-links/${id}`)

export const createQuickLink = (body: QuickLinkInput) =>
  request<QuickLink>('POST', '/api/admin/quick-links', body)

export const updateQuickLink = (id: number, body: QuickLinkInput) =>
  request<QuickLink>('PUT', `/api/admin/quick-links/${id}`, body)

export const deleteQuickLink = (id: number) =>
  request<void>('DELETE', `/api/admin/quick-links/${id}`)
