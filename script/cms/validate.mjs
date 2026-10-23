#!/usr/bin/env node
/**
 * validate.mjs — re-validate parsed payload + check for collisions
 *
 * Reads .cms-tmp/payload.json, runs zod schema, scans src/content/<col>/<slug>/
 * for existing folders (collision), and for book-review verifies bookSlug exists.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import fg from 'fast-glob'
import { schemaByCategory, collectionDir } from './schemas.mjs'

async function main() {
  const payloadPath = process.argv[2] || '.cms-tmp/payload.json'
  const repoRoot = process.env.CMS_REPO_ROOT || process.cwd()
  const raw = await fs.readFile(payloadPath, 'utf8')
  const obj = JSON.parse(raw)
  const { category, payload, issueNumber } = obj
  const schema = schemaByCategory[category]
  // Re-validate
  const validated = schema.parse(payload)

  // Collision check
  const dir = collectionDir[category]
  const target = path.join(repoRoot, 'src', 'content', dir, validated.slug)
  if (await pathExists(target)) {
    throw new Error(
      `❌ collision: ${path.relative(repoRoot, target)} already exists. ` +
        `Pick a different slug or delete the existing folder.`,
    )
  }

  // book-review → bookSlug must point to an existing book folder
  if (category === 'book-review') {
    const books = await fg('src/content/books/*/zh-cn.md', {
      cwd: repoRoot,
      onlyDirectories: false,
    })
    const known = books.map((p) => p.split('/').at(-2))
    if (!known.includes(validated.bookSlug)) {
      throw new Error(
        `❌ bookSlug=${validated.bookSlug} not found under src/content/books/. ` +
          `Known slugs: ${known.join(', ') || '(none)'}`,
      )
    }
  }

  // Soft warning on tag whitelist (currently we don't enforce)
  const knownTags = await collectAllTags(repoRoot)
  const unknown = validated.tags?.filter((t) => !knownTags.has(t)) ?? []
  if (unknown.length > 0) {
    console.warn(`⚠️  new tag(s) introduced: ${unknown.join(', ')} (not enforced, just FYI)`)
  }

  // Pass-through (validated object may coerce types like date strings)
  const out = { ...obj, payload: validated }
  await fs.writeFile(payloadPath, JSON.stringify(out, null, 2), 'utf8')
  console.log(`✅ validate OK — ${category}/${validated.slug} (issue #${issueNumber ?? '?'})`)
}

async function pathExists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function collectAllTags(root) {
  const files = await fg('src/content/**/*.md', { cwd: root })
  const set = new Set()
  for (const f of files) {
    try {
      const text = await fs.readFile(path.join(root, f), 'utf8')
      const m = /^tags:\s*\[(.*?)\]/m.exec(text)
      if (m) {
        for (const tok of m[1].split(',')) {
          const t = tok.trim().replace(/^["']|["']$/g, '')
          if (t) set.add(t)
        }
      }
    } catch {
      /* ignore */
    }
  }
  return set
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
