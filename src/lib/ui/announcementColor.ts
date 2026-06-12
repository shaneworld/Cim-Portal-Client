export const ANNOUNCEMENT_COLORS = ['blue', 'amber', 'red', 'green', 'purple', 'slate'] as const
export type AnnouncementColor = typeof ANNOUNCEMENT_COLORS[number]

interface ColorClasses { wrap: string; chip: string; tag: string }

const COLOR_MAP: Record<AnnouncementColor, ColorClasses> = {
  blue:   { wrap: 'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900',     chip: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300',     tag: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'     },
  amber:  { wrap: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900',  chip: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300',  tag: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'  },
  red:    { wrap: 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900',          chip: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300',          tag: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'          },
  green:  { wrap: 'bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-900',  chip: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300',  tag: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'  },
  purple: { wrap: 'bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-900', chip: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300', tag: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
  slate:  { wrap: 'bg-slate-50 border-slate-200 dark:bg-slate-950/40 dark:border-slate-900',  chip: 'bg-slate-100 text-slate-600 dark:bg-slate-900/50 dark:text-slate-300',  tag: 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300'  },
}

export function colorClasses(key: string): ColorClasses {
  return COLOR_MAP[key as AnnouncementColor] ?? COLOR_MAP.slate
}
