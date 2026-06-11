import { request } from './client'

export interface AnnouncementType {
  id: number
  code: string
  labelZh: string
  labelEn: string
  color: string
  icon: string
  sortOrder: number
  active: boolean
}

export interface AnnouncementTypeInput {
  code: string
  labelZh: string
  labelEn: string
  color: string
  icon: string
  sortOrder: number
  active: boolean
}

export const listAnnouncementTypes = () =>
  request<AnnouncementType[]>('GET', '/api/admin/announcement-types')

export const getAnnouncementType = (id: number) =>
  request<AnnouncementType>('GET', `/api/admin/announcement-types/${id}`)

export const createAnnouncementType = (body: AnnouncementTypeInput) =>
  request<AnnouncementType>('POST', '/api/admin/announcement-types', body)

export const updateAnnouncementType = (id: number, body: AnnouncementTypeInput) =>
  request<AnnouncementType>('PUT', `/api/admin/announcement-types/${id}`, body)

export const deleteAnnouncementType = (id: number) =>
  request<void>('DELETE', `/api/admin/announcement-types/${id}`)
