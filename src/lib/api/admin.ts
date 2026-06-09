import { request } from './client'
import type { EnumValue, EnumCategory } from './types'

export type GrantType = 'DEPARTMENT' | 'ROLE'
export interface GrantResponse { id: number; linkId: number; grantType: GrantType; grantCode: string }
export interface GrantInput { grantType: GrantType; grantCode: string }
export interface AdminLink {
  id: number; nameZh: string; nameEn: string; url: string; icon: string; environment?: 'DEV' | 'UAT' | 'RELEASE'
  categoryCode: string; statusCode: string; sortOrder: number; openInNewTab: boolean; launchApp: boolean; downloadUrl?: string
  grants: GrantResponse[]; createdAt?: string; updatedAt?: string
}
export interface LinkInput {
  nameZh: string; nameEn: string; url: string; icon: string; environment?: 'DEV' | 'UAT' | 'RELEASE'
  categoryCode: string; statusCode: string; sortOrder: number; openInNewTab: boolean; launchApp: boolean; downloadUrl?: string
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

export interface EnumValueInput { code: string; labelZh: string; labelEn: string; sortOrder: number; active: boolean }

export const listEnumValues = (category: EnumCategory) =>
  request<EnumValue[]>('GET', `/api/admin/enums/${category}`)
export const createEnumValue = (category: EnumCategory, body: EnumValueInput) =>
  request<EnumValue>('POST', `/api/admin/enums/${category}`, body)
export const updateEnumValue = (category: EnumCategory, id: number, body: EnumValueInput) =>
  request<EnumValue>('PUT', `/api/admin/enums/${category}/${id}`, body)
export const deleteEnumValue = (category: EnumCategory, id: number) =>
  request<void>('DELETE', `/api/admin/enums/${category}/${id}`)

export interface SecuritySettings {
  ssoEnabled: boolean
  issuerUri?: string
  clientId?: string
  scopes: string
  usernameClaim: string
  updatedAt?: string
}

export interface SecuritySettingsInput {
  ssoEnabled: boolean
  issuerUri?: string
  clientId?: string
  scopes: string
  usernameClaim: string
  initialPassword?: string
}

export const getSecuritySettings = () => request<SecuritySettings>('GET', '/api/admin/security-settings')
export const updateSecuritySettings = (body: SecuritySettingsInput) =>
  request<SecuritySettings>('PUT', '/api/admin/security-settings', body)
