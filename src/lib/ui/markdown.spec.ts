import { describe, it, expect } from 'vitest'
import { renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('renders tables', () => {
    const md = '| A | B |\n| - | - |\n| 1 | 2 |'
    const html = renderMarkdown(md)
    expect(html).toContain('<table')
    expect(html).toContain('<td')
  })
  it('strips images', () => {
    const html = renderMarkdown('![x](http://e.com/a.png)')
    expect(html).not.toContain('<img')
  })
  it('strips script and event handlers', () => {
    const html = renderMarkdown('<script>alert(1)</script> hi')
    expect(html).not.toContain('<script')
    expect(html.toLowerCase()).not.toContain('onerror')
  })
  it('keeps links but adds rel and blocks javascript: protocol', () => {
    expect(renderMarkdown('[ok](https://e.com)')).toContain('rel="noopener noreferrer"')
    const bad = renderMarkdown('[x](javascript:alert(1))')
    expect(bad.toLowerCase()).not.toContain('javascript:')
  })
  it('returns empty string for blank input', () => {
    expect(renderMarkdown('   ')).toBe('')
    expect(renderMarkdown('')).toBe('')
  })
})
