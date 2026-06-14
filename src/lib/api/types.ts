export type Locale = 'zh' | 'en'
export type EnumCategory = 'DEPARTMENT' | 'ROLE' | 'LINK_CATEGORY' | 'LINK_STATUS' | 'LINK_ENV' | 'ANNOUNCEMENT_TYPE'

export interface MeResponse { employeeId: string; displayNameZh: string; displayNameEn: string; departmentCode: string; roleCode: string; isAdmin: boolean }
export interface HomeLink { id: number; nameZh: string; nameEn: string; url?: string; icon: string; statusCode: string; openInNewTab: boolean; environment?: string; envColor?: string | null; envLabelZh?: string | null; envLabelEn?: string | null; launchApp: boolean; downloadUrl?: string; accessible: boolean; favorite: boolean }
export interface HomeCategory { categoryCode: string; categoryLabelZh: string; categoryLabelEn: string; links: HomeLink[] }
export interface HomeResponse { categories: HomeCategory[] }
export interface EnumValue { id: number; category: EnumCategory; code: string; labelZh: string; labelEn: string; sortOrder: number; active: boolean; color?: string | null; icon?: string | null }
export interface ApiFieldError { field: string; message: string }
export interface ApiErrorBody { timestamp: string; status: number; error: string; code: string; message: string; path: string; fieldErrors?: ApiFieldError[] | null }
