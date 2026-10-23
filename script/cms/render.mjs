#!/usr/bin/env node
/**
 * render.mjs — write Markdown file with frontmatter into
 *   src/content/<collection>/<slug>/zh-cn.md
 *
 * Reads .cms-tmp/payload.json, writes the markdown.
 * If --out <dir> is given, writes into that dir instead of the real src/content
 * (used for tests + dry-run previews).
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'
import { collectionDir } from './schemas.mjs'

const SCALAR_KEYS = new Set([
  'title',
  'description',
  'image',
  'cover',
  'slugId',
  'bookSlug',
  'author',
  'rating',
  'summary',
  'briefComment',
  'readDate',
  'readTimeHours',
  'year',
  'icon',
  'link',
  'pubDate',
  'slug',
  'pinTop',
  'draft',
])

const ARRAY_KEYS = new Set(['tags'])

function renderFrontmatter(payload, category) {
  const out = {}
  for (const [k, v] of Object.entries(payload)) {
    if (k === 'body') continue
    if (v === undefined || v === '' || v === null) continue
    if (Array.isArray(v) && v.length === 0) continue
    if (SCALAR_KEYS.has(k) || ARRAY_KEYS.has(k)) {
      out[k] = v
    } else {
      // unknown key — pass through
      out[k] = v
    }
  }
  // books / book-review / blog all need title; nothing more is strictly required here
  // (zod already ensured required fields exist).
  return YAML.stringify(out).trimEnd()
}

async function main() {
  const payloadPath = process.argv[2] || '.cms-tmp/payload.json'
  const outIdx = process.argv.indexOf('--out')
  const outOverride = outIdx >= 0 ? process.argv[outIdx + 1] : null
  const repoRoot = process.env.CMS_REPO_ROOT || process.cwd()

  const obj = JSON.parse(await fs.readFile(payloadPath, 'utf8'))
  const { category, payload } = obj
  const dir = collectionDir[category]
  const targetDir = outOverride
    ? path.resolve(outOverride, dir, payload.slug)
    : path.join(repoRoot, 'src', 'content', dir, payload.slug)
  await fs.mkdir(targetDir, { recursive: true })

  const fm = renderFrontmatter(payload, category)
  const body = payload.body ? `\n${payload.body}\n` : '\n'
  const md = `---\n${fm}\n---${body}`
  const target = path.join(targetDir, 'zh-cn.md')
  await fs.writeFile(target, md, 'utf8')
  console.log(`✅ wrote ${path.relative(repoRoot, target)}`)
}

main().catch((err) => {
  console.error('render failed:', err.message ?? err)
  process.exit(1)
})
