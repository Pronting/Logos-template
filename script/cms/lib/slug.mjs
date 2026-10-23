/**
 * lib/slug.mjs — slug validation, normalization, conflict detection
 */

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

export function isValidSlug(s) {
  return typeof s === 'string' && SLUG_RE.test(s) && s.length > 0 && s.length <= 80
}

/**
 * Normalize a free-text string into an ASCII slug.
 * - lowercases
 * - removes diacritics
 * - replaces non-alphanumeric runs with single hyphens
 * - trims leading/trailing hyphens
 *
 * Used when the issue body has Chinese titles but the user wants a slug.
 * Optional; never called automatically — only by parse-issue when --auto-slug is set.
 */
export function toAsciiSlug(input) {
  if (typeof input !== 'string') return ''
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function assertValidSlug(s) {
  if (!isValidSlug(s)) {
    throw new Error(`Invalid slug: ${JSON.stringify(s)} (must match ${SLUG_RE})`)
  }
  return s
}
