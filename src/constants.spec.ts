import { describe, it, expect } from 'vitest'
import { STORAGE_KEYS, SUPPORT_PHONE, DEFAULT_PAGE_SIZE, PAGE_ROW_HEIGHT_PX, MIN_PAGE_ROWS, LINK_STATUS, GRANT_TYPES } from './constants'

describe('constants', () => {
  it('值不变(防误改)', () => {
    expect(STORAGE_KEYS).toEqual({ token: 'cimp.token', locale: 'cimp.locale', theme: 'cimp.theme' })
    expect(SUPPORT_PHONE).toBe('39100')
    expect([DEFAULT_PAGE_SIZE, PAGE_ROW_HEIGHT_PX, MIN_PAGE_ROWS]).toEqual([10, 64, 5])
    expect(LINK_STATUS).toEqual({ ACTIVE: 'ACTIVE', MAINTENANCE: 'MAINTENANCE', DEPRECATED: 'DEPRECATED' })
    expect(GRANT_TYPES).toEqual({ DEPARTMENT: 'DEPARTMENT', ROLE: 'ROLE', GROUP: 'GROUP' })
  })
})
