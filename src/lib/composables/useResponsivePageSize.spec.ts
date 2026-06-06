import { describe, it, expect } from 'vitest'
import { computeRows } from './useResponsivePageSize'

describe('computeRows', () => {
  it('floor(height / rowHeight)', () => {
    expect(computeRows(800, 64, 5)).toBe(12)
    expect(computeRows(640, 64, 5)).toBe(10)
  })
  it('下限优先', () => {
    expect(computeRows(200, 64, 5)).toBe(5)
    expect(computeRows(64, 64, 5)).toBe(5)
  })
})
