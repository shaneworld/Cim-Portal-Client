import { request } from './client'

export type GrantType = 'DEPARTMENT' | 'ROLE'
export interface GrantResponse { id: number; linkId: number; grantType: GrantType; grantCode: string }
export interface GrantInput { grantType: GrantType; grantCode: string }
export interface AdminLink {
  id: number; code: string; nameZh: string; nameEn: string; url: string; icon: string
  categoryCode: string; statusCode: string; sortOrder: number; openInNewTab: boolean
  grants: GrantResponse[]; createdAt?: string; updatedAt?: string
}
export interface LinkInput {
  code: string; nameZh: string; nameEn: string; url: string; icon: string
  categoryCode: string; statusCode: string; sortOrder: number; openInNewTab: boolean
}

export const listLinks = (categoryCode?: string) =>
  request<AdminLink[]>('GET', `/api/admin/links${categoryCode ? `?categoryCode=${encodeURIComponent(categoryCode)}` : ''}`)
// Detail includes grants inline (the list endpoint returns grants: []), so the edit modal must use this.
export const getLink = (id: number) => request<AdminLink>('GET', `/api/admin/links/${id}`)
export const createLink = (body: LinkInput) => request<AdminLink>('POST', '/api/admin/links', body)
export const updateLink = (id: number, body: LinkInput) => request<AdminLink>('PUT', `/api/admin/links/${id}`, body)
export const deleteLink = (id: number) => request<void>('DELETE', `/api/admin/links/${id}`)
export const replaceGrants = (id: number, grants: GrantInput[]) =>
  request<GrantResponse[]>('PUT', `/api/admin/links/${id}/grants`, { grants })
