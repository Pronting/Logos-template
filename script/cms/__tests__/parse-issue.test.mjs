import { describe, it, expect } from 'vitest'
import { parseIssueBody } from '../parse-issue.mjs'

describe('parseIssueBody', () => {
  it('parses a valid blog yaml block', () => {
    const body = [
      '```yaml',
      'category: blog',
      'title: Hello world',
      'slug: hello-world',
      'pubDate: 2026-06-14',
      'slugId: hello-world',
      'tags: [测试, 教程]',
      '```',
      '',
      '## 段落',
      '正文内容。',
    ].join('\n')
    const out = parseIssueBody(body)
    expect(out.category).toBe('blog')
    expect(out.payload.title).toBe('Hello world')
    expect(out.payload.slug).toBe('hello-world')
    expect(out.payload.tags).toEqual(['测试', '教程'])
    expect(out.payload.body).toContain('## 段落')
  })

  it('rejects bad category', () => {
    const body = '```yaml\ncategory: nonsense\ntitle: x\nslug: x\npubDate: 2026-01-01\n```'
    expect(() => parseIssueBody(body)).toThrow()
  })

  it('rejects missing yaml fence', () => {
    const body = 'just plain text, no fence'
    expect(() => parseIssueBody(body)).toThrow(/fenced.*yaml/i)
  })

  it('rejects invalid slug (uppercase / underscore)', () => {
    const body = [
      '```yaml',
      'category: blog',
      'title: x',
      'slug: Invalid_Slug',
      'pubDate: 2026-01-01',
      '```',
    ].join('\n')
    expect(() => parseIssueBody(body)).toThrow(/slug/i)
  })

  it('normalizes GitHub render:yaml 2-space indent on lines after the first', () => {
    // GitHub's issue-form `render: yaml` indents every line after the first
    // by 2 spaces. yaml 1.2 then chokes with "Nested mappings are not allowed
    // in compact mappings". The parser should strip the bogus indent.
    const body = [
      '```yaml',
      'category: blog',
      '  title: Indented title',
      '  slug: indented-slug',
      '  pubDate: 2026-06-14',
      '  slugId: indented-slug',
      '```',
    ].join('\n')
    const out = parseIssueBody(body)
    expect(out.payload.title).toBe('Indented title')
    expect(out.payload.slug).toBe('indented-slug')
  })

  it('splits frontmatter from body via body: | sentinel', () => {
    // When users put markdown body inside the yaml fence (which happens because
    // GitHub's render:yaml wraps the whole field), the parser must split on
    // the `body: |` sentinel and treat everything after as the markdown body.
    const body = [
      '```yaml',
      'category: blog',
      '  title: With body',
      '  slug: with-body',
      '  pubDate: 2026-06-14',
      '  slugId: with-body',
      '  body: |',
      '  ## 这是正文',
      '  正文内容',
      '  - 列表项',
      '```',
    ].join('\n')
    const out = parseIssueBody(body)
    expect(out.payload.title).toBe('With body')
    expect(out.payload.body).toContain('## 这是正文')
    expect(out.payload.body).toContain('- 列表项')
  })
})
