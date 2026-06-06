import { createSampleMetrics } from './sampleMetrics'
import type { MetricsProvider } from './MetricsProvider'
export type { PortalMetrics, MetricsProvider } from './MetricsProvider'
export function createMetricsProvider(): MetricsProvider { return createSampleMetrics() }
