import { describe, it, expect } from 'vitest'
import { renderMarkdown, markdownToText } from './markdown'

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
    expect(bad).not.toContain('href="javascript:')      // no executable js href
    expect(bad.toLowerCase()).not.toContain('<script')
  })
  it('returns empty string for blank input', () => {
    expect(renderMarkdown('   ')).toBe('')
    expect(renderMarkdown('')).toBe('')
  })
})

describe('markdownToText', () => {
  it('strips table markup to readable text', () => {
    const t = markdownToText('| A | B |\n| - | - |\n| 1 | 2 |')
    expect(t).not.toContain('|')
    expect(t).not.toContain('<table')
    expect(t).toContain('A')
    expect(t).toContain('1')
  })
  it('strips emphasis markers', () => {
    expect(markdownToText('**bold** and _em_')).toContain('bold')
    expect(markdownToText('**bold**')).not.toContain('*')
  })
  it('returns empty for blank', () => {
    expect(markdownToText('')).toBe('')
    expect(markdownToText('   ')).toBe('')
  })
  it('does not leak script', () => {
    expect(markdownToText('<script>alert(1)</script>hi').toLowerCase()).not.toContain('<script')
  })
})
