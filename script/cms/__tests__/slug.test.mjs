import { describe, it, expect } from 'vitest'
import { isValidSlug, toAsciiSlug, assertValidSlug } from '../lib/slug.mjs'

describe('slug', () => {
  it('accepts canonical kebab-case', () => {
    expect(isValidSlug('hello-world')).toBe(true)
    expect(isValidSlug('a')).toBe(true)
    expect(isValidSlug('abc-123')).toBe(true)
  })
  it('rejects uppercase, spaces, leading/trailing dash', () => {
    expect(isValidSlug('Hello-World')).toBe(false)
    expect(isValidSlug('hello world')).toBe(false)
    expect(isValidSlug('-abc')).toBe(false)
    expect(isValidSlug('abc-')).toBe(false)
    expect(isValidSlug('')).toBe(false)
  })
  it('toAsciiSlug strips Chinese and normalizes', () => {
    // Chinese chars have no ASCII transliteration in this naive pass → empty.
    // Users should call toAsciiSlug on English titles only.
    expect(toAsciiSlug('你好 世界')).toBe('')
    expect(toAsciiSlug('My Post #1!')).toBe('my-post-1')
  })
  it('assertValidSlug throws on bad', () => {
    expect(() => assertValidSlug('Bad')).toThrow(/Invalid slug/)
    expect(assertValidSlug('ok-1')).toBe('ok-1')
  })
})
