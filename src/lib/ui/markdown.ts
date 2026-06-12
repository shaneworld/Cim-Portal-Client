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

export function renderMarkdown(src: string): string {
  if (!src || !src.trim()) return ''
  const rawHtml = md.render(src)
  return String(DOMPurify.sanitize(rawHtml, PURIFY_CONFIG as any))
}

export function markdownToText(src: string): string {
  if (!src || !src.trim()) return ''
  const html = renderMarkdown(src)
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const text = doc.body.textContent || ''
  // renderMarkdown escapes raw HTML (html:false) to entities; textContent decodes
  // them back to literal characters. Strip any residual angle-bracket tag-like
  // sequences so leftover markup (e.g. "<script>…</script>") never surfaces in
  // the plain-text preview.
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}
