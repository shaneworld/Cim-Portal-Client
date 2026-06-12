import { request } from './client'

export interface Announcement {
  id: number
  titleZh: string
  titleEn: string
  bodyZh: string
  bodyEn: string
  typeCode: string
  typeLabelZh: string
  typeLabelEn: string
  typeColor: string
  typeIcon: string
  pinned: boolean
  startsAt?: string
  endsAt?: string
  active: boolean
  closedAt?: string | null
  createdAt: string
}

export interface AnnouncementInput {
  titleZh: string
  titleEn: string
  bodyZh: string
  bodyEn: string
  typeCode: string
  pinned: boolean
  active: boolean
  startsAt?: string
  endsAt?: string
}

export const listAdminAnnouncements = () =>
  request<Announcement[]>('GET', '/api/admin/announcements')

export const getAdminAnnouncement = (id: number) =>
  request<Announcement>('GET', `/api/admin/announcements/${id}`)

export const createAnnouncement = (body: AnnouncementInput) =>
  request<Announcement>('POST', '/api/admin/announcements', body)

export const updateAnnouncement = (id: number, body: AnnouncementInput) =>
  request<Announcement>('PUT', `/api/admin/announcements/${id}`, body)

export const deleteAnnouncement = (id: number) =>
  request<void>('DELETE', `/api/admin/announcements/${id}`)
