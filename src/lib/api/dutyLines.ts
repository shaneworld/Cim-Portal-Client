import { request } from './client'

export interface DutyLine {
  id: number
  labelZh: string
  labelEn: string
  phone: string
  sortOrder: number
  active: boolean
  scheduleName?: string | null
  dutyName?: string | null
}

export interface DutyLineInput {
  labelZh: string
  labelEn: string
  phone: string
  sortOrder: number
  active: boolean
  scheduleName?: string
}

export const listAdminDutyLines = () =>
  request<DutyLine[]>('GET', '/api/admin/duty-lines')

export const getAdminDutyLine = (id: number) =>
  request<DutyLine>('GET', `/api/admin/duty-lines/${id}`)

export const createDutyLine = (body: DutyLineInput) =>
  request<DutyLine>('POST', '/api/admin/duty-lines', body)

export const updateDutyLine = (id: number, body: DutyLineInput) =>
  request<DutyLine>('PUT', `/api/admin/duty-lines/${id}`, body)

export const deleteDutyLine = (id: number) =>
  request<void>('DELETE', `/api/admin/duty-lines/${id}`)
