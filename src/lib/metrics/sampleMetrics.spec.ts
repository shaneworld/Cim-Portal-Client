import { describe, it, expect } from 'vitest'
import { createMetricsProvider } from './index'
describe('metrics', () => {
  it('sample provider returns labeled sample KPIs', async () => {
    const m = await createMetricsProvider().getMetrics()
    expect(m.sample).toBe(true)
    expect(m.oeePct).toBeGreaterThan(0)
    expect(m.shiftOutput.length).toBeGreaterThan(3)
  })
})
