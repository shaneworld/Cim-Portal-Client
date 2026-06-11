import { request } from './client'

export interface Group {
  id: number
  code: string
  nameZh: string
  nameEn: string
  active: boolean
}

export interface GroupInput {
  code: string
  nameZh: string
  nameEn: string
  active: boolean
}

export const listGroups = () =>
  request<Group[]>('GET', '/api/admin/permission-groups')

export const getGroup = (id: number) =>
  request<Group>('GET', `/api/admin/permission-groups/${id}`)

export const createGroup = (body: GroupInput) =>
  request<Group>('POST', '/api/admin/permission-groups', body)

export const updateGroup = (id: number, body: GroupInput) =>
  request<Group>('PUT', `/api/admin/permission-groups/${id}`, body)

export const deleteGroup = (id: number) =>
  request<void>('DELETE', `/api/admin/permission-groups/${id}`)

export const getMembers = (id: number) =>
  request<string[]>('GET', `/api/admin/permission-groups/${id}/members`)

export const replaceMembers = (id: number, employeeIds: string[]) =>
  request<string[]>('PUT', `/api/admin/permission-groups/${id}/members`, { employeeIds })
