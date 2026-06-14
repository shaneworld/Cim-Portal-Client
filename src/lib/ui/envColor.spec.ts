import { describe, it, expect } from 'vitest'
import { envColorClasses } from './envColor'
describe('envColorClasses', () => {
  it('returns non-empty badge+dot for each palette color', () => {
    for (const c of ['blue','amber','red','green','purple','slate']) {
      const r = envColorClasses(c)
      expect(r.badge).toBeTruthy(); expect(r.dot).toBeTruthy()
    }
  })
  it('falls back to slate for unknown/empty/null', () => {
    expect(envColorClasses('teal')).toEqual(envColorClasses('slate'))
    expect(envColorClasses(undefined)).toEqual(envColorClasses('slate'))
    expect(envColorClasses(null)).toEqual(envColorClasses('slate'))
  })
})
