#!/usr/bin/env node
/**
 * attach-images.mjs — fetch image attachments pasted into a GitHub issue and
 * rewrite them to <slug>.png relative paths in the rendered markdown.
 *
 * Required env: GH_TOKEN, GH_REPO, GH_ISSUE_NUMBER
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import https from 'node:https'

const ATTACH_RE = /https?:\/\/github\.com\/user-attachments\/assets\/[a-f0-9-]+/gi

function download(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('too many redirects'))
    const req = https.get(url, { headers: { 'User-Agent': 'cms-bot' } }, (res) => {
      if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode)) {
        const loc = res.headers.location
        if (loc) return download(loc, dest, redirects + 1).then(resolve, reject)
      }
      if (res.statusCode !== 200) return reject(new Error(`download ${res.statusCode}: ${url}`))
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => fs.writeFile(dest, Buffer.concat(chunks)).then(resolve, reject))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.setTimeout(60_000, () => req.destroy(new Error('download timeout')))
  })
}

async function listIssueAttachments(token, repo, issueNumber) {
  const out = new Set()
  let page = 1
  while (true) {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/issues/${issueNumber}/comments?per_page=100&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    )
    if (!res.ok) throw new Error(`list comments ${res.statusCode}`)
    const comments = await res.json()
    if (comments.length === 0) break
    for (const c of comments) {
      const body = c.body ?? ''
      for (const m of body.matchAll(ATTACH_RE)) out.add(m[0])
    }
    if (comments.length < 100) break
    page += 1
  }
  return [...out]
}

async function main() {
  const repoRoot = process.env.CMS_REPO_ROOT || process.cwd()
  const collection = process.env.CMS_COLLECTION || 'blog'
  const slug = process.env.CMS_SLUG
  if (!slug) {
    console.log('attach-images: CMS_SLUG not set, skipping')
    process.exit(0)
  }
  const token = process.env.GH_TOKEN
  const repo = process.env.GH_REPO
  const issueNumber = process.env.GH_ISSUE_NUMBER
  if (!token || !repo || !issueNumber) {
    console.log('attach-images: GH_TOKEN/GH_REPO/GH_ISSUE_NUMBER not set, skipping')
    process.exit(0)
  }

  const urls = await listIssueAttachments(token, repo, issueNumber)
  if (urls.length === 0) {
    console.log('attach-images: no image attachments found in issue')
    process.exit(0)
  }
  const outDir = path.join(repoRoot, 'src', 'content', collection, slug)
  await fs.mkdir(outDir, { recursive: true })

  const downloaded = []
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    const ext = (url.match(/\.(png|jpg|jpeg|gif|webp|svg)/i)?.[1] ?? 'png').toLowerCase()
    const filename = i === 0 ? `${slug}.${ext}` : `${slug}-${i + 1}.${ext}`
    const dest = path.join(outDir, filename)
    try {
      await download(url, dest)
      downloaded.push({ url, filename })
      console.log(`📥 ${filename}`)
    } catch (err) {
      console.warn(`⚠️  failed ${url}: ${err.message}`)
    }
  }
  if (downloaded.length === 0) process.exit(0)

  const zhPath = path.join(outDir, 'zh-cn.md')
  let md = await fs.readFile(zhPath, 'utf8')
  if (!/^image:\s*\S/m.test(md)) {
    md = md.replace(/^(---\n)/, `$1image: ${downloaded[0].filename}\n`)
  }
  for (const { url, filename } of downloaded) {
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    md = md.replace(new RegExp(escaped, 'g'), filename)
  }
  await fs.writeFile(zhPath, md, 'utf8')
  console.log(`✅ rewrote ${zhPath} with ${downloaded.length} local image(s)`)
}

const isCli = process.argv[1]?.endsWith('attach-images.mjs')
if (isCli) {
  main().catch((err) => {
    console.error('attach-images failed:', err)
    process.exit(1)
  })
}
