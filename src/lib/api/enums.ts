import { request } from './client'
import type { EnumCategory, EnumValue } from './types'

export const listEnum = (category: EnumCategory) => request<EnumValue[]>('GET', `/api/enums/${category}`)
