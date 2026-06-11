export const ANNOUNCEMENT_COLORS = ['blue', 'amber', 'red', 'green', 'purple', 'slate'] as const
export type AnnouncementColor = typeof ANNOUNCEMENT_COLORS[number]

interface ColorClasses { wrap: string; chip: string; tag: string }

const COLOR_MAP: Record<AnnouncementColor, ColorClasses> = {
  blue:   { wrap: 'bg-blue-50 border-blue-200',   chip: 'bg-blue-100 text-blue-600',   tag: 'bg-blue-100 text-blue-700'   },
  amber:  { wrap: 'bg-amber-50 border-amber-200',  chip: 'bg-amber-100 text-amber-600',  tag: 'bg-amber-100 text-amber-700'  },
  red:    { wrap: 'bg-red-50 border-red-200',      chip: 'bg-red-100 text-red-600',      tag: 'bg-red-100 text-red-700'      },
  green:  { wrap: 'bg-green-50 border-green-200',  chip: 'bg-green-100 text-green-600',  tag: 'bg-green-100 text-green-700'  },
  purple: { wrap: 'bg-purple-50 border-purple-200',chip: 'bg-purple-100 text-purple-600',tag: 'bg-purple-100 text-purple-700'},
  slate:  { wrap: 'bg-slate-50 border-slate-200',  chip: 'bg-slate-100 text-slate-600',  tag: 'bg-slate-100 text-slate-700'  },
}

export function colorClasses(key: string): ColorClasses {
  return COLOR_MAP[key as AnnouncementColor] ?? COLOR_MAP.slate
}
