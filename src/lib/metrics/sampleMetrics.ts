import type { MetricsProvider } from './MetricsProvider'
/** SAMPLE data — backend has no metrics feed yet. Clearly flagged via `sample:true`. */
export function createSampleMetrics(): MetricsProvider {
  return { async getMetrics() {
    return { oeePct: 87.4, wip: 1240, yieldPct: 98.2, throughput: '24.6k',
      wipDeltaPct: 3.2, yieldDeltaPct: 0.4, throughputDeltaPct: -1.1,
      shiftOutput: [40, 54, 46, 78, 70, 100, 92, 116, 110], sample: true }
  } }
}
