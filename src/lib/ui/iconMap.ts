import { Factory, LineChart, TrendingUp, Wrench, Package, Boxes, Book, FileText, Archive, Gauge, Activity, LayoutGrid } from 'lucide-vue-next'
import type { LucideIcon } from 'lucide-vue-next'

const map: Record<string, LucideIcon> = {
  factory: Factory,
  'line-chart': LineChart,
  'trending-up': TrendingUp,
  wrench: Wrench,
  package: Package,
  boxes: Boxes,
  book: Book,
  'file-text': FileText,
  archive: Archive,
  gauge: Gauge,
  activity: Activity,
}

export const FALLBACK_ICON = LayoutGrid

export function iconFor(name: string): LucideIcon {
  return map[name] ?? FALLBACK_ICON
}
