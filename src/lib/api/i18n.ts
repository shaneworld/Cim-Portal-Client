import { request } from './client'
import type { LabelMap } from './types'

export const getLabels = () => request<LabelMap>('GET', '/api/i18n/labels')
