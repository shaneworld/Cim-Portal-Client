import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Gauge from './Gauge.vue'
import Sparkline from './Sparkline.vue'
import AreaChart from './AreaChart.vue'
import KpiStat from './KpiStat.vue'

describe('viz primitives', () => {
  it('Gauge renders an svg arc + the value text', () => {
    const w = mount(Gauge, { props: { value: 87.4, label: 'OEE %' } })
    expect(w.find('svg').exists()).toBe(true); expect(w.text()).toContain('87.4'); expect(w.text()).toContain('OEE')
  })
  it('Sparkline renders a polyline from points', () => {
    const w = mount(Sparkline, { props: { points: [1, 4, 2, 6] } })
    expect(w.find('polyline,path').exists()).toBe(true)
  })
  it('AreaChart renders an area path from points', () => {
    const w = mount(AreaChart, { props: { points: [40, 54, 46, 78] } })
    expect(w.findAll('path').length).toBeGreaterThanOrEqual(1)
  })
  it('KpiStat shows value + delta with direction', () => {
    const up = mount(KpiStat, { props: { label: 'WIP', value: '1,240', deltaPct: 3.2 } })
    expect(up.text()).toContain('1,240'); expect(up.text()).toContain('3.2')
    const down = mount(KpiStat, { props: { label: 'X', value: '1', deltaPct: -1.1 } })
    expect(down.html()).toMatch(/stop|rose|▼|down/i)
  })
})
