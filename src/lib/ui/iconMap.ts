import {
  Factory, LineChart, TrendingUp, Wrench, Package, Boxes, Book, FileText, Archive, Gauge, Activity, LayoutGrid,
  Database, Server, Cpu, HardDrive, Network, Cloud, Monitor, Settings, Cog, Shield, ShieldCheck, Lock, KeyRound,
  Users, User, Bell, Mail, Calendar, Clock, Folder, Layers, BarChart3, PieChart, ClipboardList, Truck, Warehouse,
  FlaskConical, Microscope, Hammer, ScanLine, Search, Globe, Workflow, Bot, Zap, Terminal, Building2,
} from 'lucide-vue-next'
import type { LucideIcon } from 'lucide-vue-next'

// Exactly 48 icons → fills a 6-col (mobile) / 8-col (desktop) grid with no ragged row.
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
  database: Database,
  server: Server,
  cpu: Cpu,
  'hard-drive': HardDrive,
  network: Network,
  cloud: Cloud,
  monitor: Monitor,
  terminal: Terminal,
  bot: Bot,
  workflow: Workflow,
  zap: Zap,
  settings: Settings,
  cog: Cog,
  shield: Shield,
  'shield-check': ShieldCheck,
  lock: Lock,
  key: KeyRound,
  users: Users,
  user: User,
  bell: Bell,
  mail: Mail,
  calendar: Calendar,
  clock: Clock,
  folder: Folder,
  layers: Layers,
  'bar-chart': BarChart3,
  'pie-chart': PieChart,
  clipboard: ClipboardList,
  truck: Truck,
  warehouse: Warehouse,
  flask: FlaskConical,
  microscope: Microscope,
  hammer: Hammer,
  scan: ScanLine,
  search: Search,
  globe: Globe,
  building: Building2,
}

export const ICON_KEYS = Object.keys(map)

export const FALLBACK_ICON = LayoutGrid

export function iconFor(name: string): LucideIcon {
  return map[name] ?? FALLBACK_ICON
}
