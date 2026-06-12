import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const md = new MarkdownIt({ html: false, linkify: true, breaks: true })
// markdown-it enables GFM tables by default.

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'em', 'del', 'blockquote', 'ul', 'ol', 'li',
    'code', 'pre', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: ['href', 'title', 'align', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/|#)/i,
} as const

// Dangerous URI schemes. markdown-it (validateLink) already refuses to turn
// these into links and DOMPurify's ALLOWED_URI_REGEXP blocks them as attrs,
// so they can never be an executable href. This extra pass only neutralizes the
// scheme when it survives as inert literal text (e.g. `[x](javascript:..)`,
// which markdown-it leaves as plain text) — defense in depth, not a relaxation.
const DANGEROUS_SCHEME = /(javascript|data|vbscript)\s*:/gi

export function renderMarkdown(src: string): string {
  if (!src || !src.trim()) return ''
  const rawHtml = md.render(src)
  const clean = String(DOMPurify.sanitize(rawHtml, PURIFY_CONFIG as any))
  return clean.replace(DANGEROUS_SCHEME, '$1&#58;')
}
