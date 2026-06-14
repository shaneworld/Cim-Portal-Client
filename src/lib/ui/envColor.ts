export interface EnvBadge { badge: string; dot: string }
const PALETTE: Record<string, EnvBadge> = {
  slate:  { badge: 'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300', dot: 'bg-slate-500 dark:bg-slate-400' },
  amber:  { badge: 'bg-amber-500/10 text-amber-600 ring-amber-500/25 dark:text-amber-300', dot: 'bg-amber-500' },
  green:  { badge: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/25 dark:text-emerald-300', dot: 'bg-emerald-500' },
  blue:   { badge: 'bg-blue-500/10 text-blue-600 ring-blue-500/25 dark:text-blue-300', dot: 'bg-blue-500' },
  red:    { badge: 'bg-red-500/10 text-red-600 ring-red-500/25 dark:text-red-300', dot: 'bg-red-500' },
  purple: { badge: 'bg-purple-500/10 text-purple-600 ring-purple-500/25 dark:text-purple-300', dot: 'bg-purple-500' },
}
export function envColorClasses(color?: string | null): EnvBadge {
  return PALETTE[color ?? ''] ?? PALETTE.slate
}
