// Lightweight, dependency-free markdown → plain text for previews (no markdown-it).
// Good enough for a single-line clamp; NOT a renderer.
export function stripMarkdown(src: string): string {
  if (!src || !src.trim()) return ''
  return src
    .replace(/```[\s\S]*?```/g, ' ')          // fenced code blocks
    .replace(/`([^`]*)`/g, '$1')               // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')     // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')   // links → text
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')         // headings
    .replace(/^\s{0,3}>\s?/gm, '')              // blockquotes
    .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, '')  // list markers
    .replace(/^\s*([-*_]\s*){3,}$/gm, ' ')      // hr
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1') // bold/italic/strike
    .replace(/\|/g, ' ')                        // table pipes
    .replace(/<[^>]*>/g, '')                    // any stray HTML tags
    .replace(/\s+/g, ' ')
    .trim()
}
