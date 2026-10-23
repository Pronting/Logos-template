import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)
let tmpDir

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-validate-'))
  // Fake content tree with a known book
  await fs.mkdir(path.join(tmpDir, 'src/content/books/flyd'), { recursive: true })
  await fs.writeFile(path.join(tmpDir, 'src/content/books/flyd/zh-cn.md'), '---\ntitle: t\n---\n')
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

async function runValidate(payload) {
  const payloadPath = path.join(tmpDir, 'payload.json')
  await fs.writeFile(payloadPath, JSON.stringify(payload))
  return exec('node', [
    path.resolve('script/cms/validate.mjs'),
    payloadPath,
  ], { env: { ...process.env, CMS_REPO_ROOT: tmpDir } })
}

describe('validate.mjs', () => {
  it('passes a valid blog payload', async () => {
    const { stdout } = await runValidate({
      category: 'blog',
      payload: { title: 'a', slug: 'abc-def', pubDate: '2026-06-14', slugId: 'abc-def' },
    })
    expect(stdout).toMatch(/validate OK/)
  })

  it('rejects duplicate slug folder', async () => {
    await fs.mkdir(path.join(tmpDir, 'src/content/blog/abc-def'), { recursive: true })
    await expect(runValidate({
      category: 'blog',
      payload: { title: 'a', slug: 'abc-def', pubDate: '2026-06-14', slugId: 'abc-def' },
    })).rejects.toThrow(/collision/)
  })

  it('rejects unknown bookSlug for book-review', async () => {
    await expect(runValidate({
      category: 'book-review',
      payload: {
        title: 'r', slug: 'r-1', pubDate: '2026-06-14', slugId: 'r-1', bookSlug: 'nonexistent-book',
      },
    })).rejects.toThrow(/bookSlug.*not found/)
  })

  it('accepts known bookSlug for book-review', async () => {
    const { stdout } = await runValidate({
      category: 'book-review',
      payload: {
        title: 'r', slug: 'r-2', pubDate: '2026-06-14', slugId: 'r-2', bookSlug: 'flyd',
      },
    })
    expect(stdout).toMatch(/validate OK/)
  })
})
