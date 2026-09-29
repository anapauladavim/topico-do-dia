/**
 * Collapse whitespace and strip control characters. This is defense in depth:
 * output is always escaped by React, but we also never store control chars,
 * angle-bracket tag soup, or unbounded strings.
 */
export function sanitizeText(input: unknown, maxLen: number): string {
  if (typeof input !== 'string') return ''
  let text = input
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length > maxLen) text = text.slice(0, maxLen)
  return text
}

/** Multi-line variant that preserves line breaks (for comments / responses). */
export function sanitizeMultiline(input: unknown, maxLen: number): string {
  if (typeof input !== 'string') return ''
  let text = input
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
  if (text.length > maxLen) text = text.slice(0, maxLen)
  return text
}

export const LIMITS = {
  nickname: 40,
  comment: 1000,
  questionText: 500,
  optionLabel: 200,
  openResponseMax: 2000,
}
