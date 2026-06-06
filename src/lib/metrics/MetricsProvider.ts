export interface PortalMetrics {
  oeePct: number; wip: number; yieldPct: number; throughput: string
  wipDeltaPct: number; yieldDeltaPct: number; throughputDeltaPct: number
  shiftOutput: number[]
  sample: boolean
}
export interface MetricsProvider { getMetrics(): Promise<PortalMetrics> }
