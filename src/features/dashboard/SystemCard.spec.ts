import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { i18n } from '@/lib/i18n'
import SystemCard from './SystemCard.vue'

// Mock the portal API module
vi.mock('@/lib/api/portal', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/portal')>()
  return { ...actual, toggleFavorite: vi.fn().mockResolvedValue(undefined) }
})

const baseLink = {
  id: 1,
  nameZh: '在制品管理',
  nameEn: 'WIP',
  url: 'https://x',
  icon: 'factory',
  statusCode: 'ACTIVE',
  openInNewTab: true,
  launchApp: false,
  accessible: true,
  favorite: false,
}

const accessibleWithEnv = {
  ...baseLink,
  id: 2,
  environment: 'DEV' as const,
  favorite: false,
}

const favoriteLink = {
  ...baseLink,
  id: 3,
  favorite: true,
}

const lockedLink = {
  ...baseLink,
  id: 4,
  accessible: false,
  favorite: false,
}

describe('SystemCard', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'zh'
    setActivePinia(createPinia())
  })
  afterEach(() => { vi.restoreAllMocks() })

  it('accessible card renders star button', () => {
    const w = mount(SystemCard, { props: { link: baseLink }, global: { plugins: [i18n] } })
    const star = w.find('button')
    expect(star.exists()).toBe(true)
  })

  it('accessible card with environment: star button AND env badge both render', () => {
    const w = mount(SystemCard, { props: { link: accessibleWithEnv }, global: { plugins: [i18n] } })
    // env badge must still be present
    expect(w.text()).toContain('DEV')
    // star button must also be present
    const star = w.find('button')
    expect(star.exists()).toBe(true)
  })

  it('unfavorited star has no fill class; favorited star has fill-current', () => {
    const wUnfav = mount(SystemCard, { props: { link: baseLink }, global: { plugins: [i18n] } })
    const svgUnfav = wUnfav.find('button svg')
    expect(svgUnfav.classes()).not.toContain('fill-current')

    const wFav = mount(SystemCard, { props: { link: favoriteLink }, global: { plugins: [i18n] } })
    const svgFav = wFav.find('button svg')
    expect(svgFav.classes()).toContain('fill-current')
  })

  it('locked/non-accessible card has NO star button', () => {
    const w = mount(SystemCard, { props: { link: lockedLink }, global: { plugins: [i18n] } })
    expect(w.find('button').exists()).toBe(false)
  })

  it('clicking star calls toggleFavorite and flips local state', async () => {
    const portalMod = await import('@/lib/api/portal')
    const toggleSpy = vi.spyOn(portalMod, 'toggleFavorite').mockResolvedValue(undefined)

    const w = mount(SystemCard, { props: { link: baseLink }, global: { plugins: [i18n] } })
    const star = w.find('button')
    await star.trigger('click')
    await flushPromises()

    expect(toggleSpy).toHaveBeenCalledWith(1, true)
    // After click, the SVG should now have fill-current (toggled to favorite)
    expect(w.find('button svg').classes()).toContain('fill-current')
  })

  it('clicking a favorited star calls toggleFavorite with false (remove)', async () => {
    const portalMod = await import('@/lib/api/portal')
    const toggleSpy = vi.spyOn(portalMod, 'toggleFavorite').mockResolvedValue(undefined)

    const w = mount(SystemCard, { props: { link: favoriteLink }, global: { plugins: [i18n] } })
    const star = w.find('button')
    await star.trigger('click')
    await flushPromises()

    expect(toggleSpy).toHaveBeenCalledWith(3, false)
    // After removing favorite, SVG should not have fill-current
    expect(w.find('button svg').classes()).not.toContain('fill-current')
  })

  it('emits favorite-changed event after successful toggle', async () => {
    const portalMod = await import('@/lib/api/portal')
    vi.spyOn(portalMod, 'toggleFavorite').mockResolvedValue(undefined)

    const w = mount(SystemCard, { props: { link: baseLink }, global: { plugins: [i18n] } })
    await w.find('button').trigger('click')
    await flushPromises()

    const emitted = w.emitted('favorite-changed')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual({ id: 1, favorite: true })
  })

  it('on toggleFavorite failure: reverts local state', async () => {
    const portalMod = await import('@/lib/api/portal')
    vi.spyOn(portalMod, 'toggleFavorite').mockRejectedValue(new Error('Network error'))

    const w = mount(SystemCard, { props: { link: baseLink }, global: { plugins: [i18n] } })
    // Initially not favorite
    expect(w.find('button svg').classes()).not.toContain('fill-current')
    await w.find('button').trigger('click')
    await flushPromises()

    // Should revert back to unfavorited
    expect(w.find('button svg').classes()).not.toContain('fill-current')
  })

  it('env badge still renders alongside star on accessible env card (parity check)', () => {
    const w = mount(SystemCard, { props: { link: { ...accessibleWithEnv, environment: 'UAT' as const } }, global: { plugins: [i18n] } })
    expect(w.text()).toContain('UAT')
    expect(w.find('button').exists()).toBe(true)
  })
})
