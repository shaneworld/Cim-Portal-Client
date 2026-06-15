import { describe, it, expect } from 'vitest'
import { stripMarkdown } from './markdownText'

describe('stripMarkdown', () => {
  it('strips headings to clean text', () => {
    expect(stripMarkdown('# Hello world')).toBe('Hello world')
    expect(stripMarkdown('### Title')).toBe('Title')
  })
  it('strips bold/italic/strike markers', () => {
    expect(stripMarkdown('**bold** and _em_ and ~~del~~')).toBe('bold and em and del')
    expect(stripMarkdown('**bold**')).not.toContain('*')
  })
  it('strips links to their text', () => {
    expect(stripMarkdown('see [the docs](https://e.com)')).toBe('see the docs')
    expect(stripMarkdown('[x](https://e.com)')).not.toContain('http')
  })
  it('strips inline and fenced code', () => {
    expect(stripMarkdown('use `npm run` now')).toBe('use npm run now')
    expect(stripMarkdown('a\n```\ncode block\n```\nb')).toBe('a b')
  })
  it('strips list markers', () => {
    expect(stripMarkdown('- item one\n- item two')).toBe('item one item two')
    expect(stripMarkdown('1. first\n2. second')).toBe('first second')
  })
  it('strips table pipes to readable text', () => {
    const t = stripMarkdown('| A | B |\n| - | - |\n| 1 | 2 |')
    expect(t).not.toContain('|')
    expect(t).toContain('A')
    expect(t).toContain('1')
  })
  it('returns empty for blank input', () => {
    expect(stripMarkdown('')).toBe('')
    expect(stripMarkdown('   ')).toBe('')
  })
  it('removes stray HTML tags', () => {
    const t = stripMarkdown('<script>alert(1)</script>hi')
    expect(t.toLowerCase()).not.toContain('<script')
    expect(t).not.toContain('<')
    expect(t).not.toContain('>')
    expect(t).toContain('hi')
  })
})
