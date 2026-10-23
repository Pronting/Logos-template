import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)

let tmpDir

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-render-'))
  await fs.writeFile(path.join(tmpDir, 'payload.json'), JSON.stringify({
    category: 'blog',
    payload: {
      title: '测试文章',
      slug: 'test-post',
      pubDate: '2026-06-14',
      slugId: 'test-post',
      tags: ['教程', '测试'],
      description: '描述',
      pinTop: 0,
      draft: false,
      body: '## 标题\n\n正文段落。',
    },
  }))
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('render.mjs', () => {
  it('writes zh-cn.md with correct frontmatter + body', async () => {
    const outDir = path.join(tmpDir, 'out')
    await exec('node', [
      path.resolve('script/cms/render.mjs'),
      path.join(tmpDir, 'payload.json'),
      '--out', outDir,
    ], { env: { ...process.env, CMS_REPO_ROOT: tmpDir } })
    const target = path.join(outDir, 'blog', 'test-post', 'zh-cn.md')
    const md = await fs.readFile(target, 'utf8')
    expect(md).toMatch(/^---\n/)
    expect(md).toContain('title: 测试文章')
    expect(md).toContain('slug: test-post')
    expect(md).toContain('pubDate: 2026-06-14')
    expect(md).toContain('tags:')
    expect(md).toContain('- 教程')
    expect(md).toContain('- 测试')
    expect(md).toContain('## 标题')
    expect(md).toContain('正文段落。')
  })

  it('omits empty optional fields', async () => {
    await fs.writeFile(path.join(tmpDir, 'payload.json'), JSON.stringify({
      category: 'book-review',
      payload: {
        title: '短评',
        slug: 'short',
        pubDate: '2026-01-01',
        slugId: 'short',
        bookSlug: 'flyd',
        rating: 'recommended',
        body: '正文',
      },
    }))
    const outDir = path.join(tmpDir, 'out2')
    await exec('node', [
      path.resolve('script/cms/render.mjs'),
      path.join(tmpDir, 'payload.json'),
      '--out', outDir,
    ], { env: { ...process.env, CMS_REPO_ROOT: tmpDir } })
    const md = await fs.readFile(path.join(outDir, 'book-review', 'short', 'zh-cn.md'), 'utf8')
    expect(md).toContain('bookSlug: flyd')
    // Empty optional fields must be absent (no `description: ""` line)
    expect(md).not.toMatch(/^description:\s*$/m)
    expect(md).not.toMatch(/^image:\s*$/m)
  })
})
