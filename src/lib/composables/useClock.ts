import { ref, onMounted, onUnmounted } from 'vue'
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
export function useClock() {
  const time = ref(''); const weekday = ref('')
  let timer: ReturnType<typeof setInterval> | undefined
  const pad = (n: number) => String(n).padStart(2, '0')
  function tick() { const d = new Date(); time.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; weekday.value = WEEKDAYS[d.getDay()] }
  tick()
  onMounted(() => { tick(); timer = setInterval(tick, 1000) })
  onUnmounted(() => { if (timer) clearInterval(timer) })
  return { time, weekday }
}
