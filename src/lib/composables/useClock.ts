import { ref, onMounted, onUnmounted } from 'vue'
import { i18n } from '@/lib/i18n'

const WEEKDAY_KEYS = [
  'dashboard.weekday.sun',
  'dashboard.weekday.mon',
  'dashboard.weekday.tue',
  'dashboard.weekday.wed',
  'dashboard.weekday.thu',
  'dashboard.weekday.fri',
  'dashboard.weekday.sat',
] as const

export function useClock() {
  const time = ref(''); const weekday = ref('')
  let timer: ReturnType<typeof setInterval> | undefined
  const pad = (n: number) => String(n).padStart(2, '0')
  function tick() { const d = new Date(); time.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; weekday.value = i18n.global.t(WEEKDAY_KEYS[d.getDay()]) }
  tick()
  onMounted(() => { tick(); timer = setInterval(tick, 1000) })
  onUnmounted(() => { if (timer) clearInterval(timer) })
  return { time, weekday }
}
