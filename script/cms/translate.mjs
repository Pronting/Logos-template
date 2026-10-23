#!/usr/bin/env node
/**
 * translate.mjs — translate zh-cn.md to en.md via an OpenAI-compatible API
 *
 * Reads env:
 *   LLM_BASE_URL    (default: https://api.deepseek.com/v1)
 *   LLM_API_KEY     (required for actual translation; falls back to placeholder if missing)
 *   LLM_MODEL       (default: deepseek-chat)
 *
 * Inputs:  src/content/<col>/<slug>/zh-cn.md
 * Outputs: src/content/<col>/<slug>/en.md  (or placeholder on failure)
 *
 * The translator is asked to translate only the frontmatter string fields
 * (title, description, summary, briefComment) and the body — not the
 * structural fields (slug, pubDate, tags, etc.).
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import fg from 'fast-glob'
import YAML from 'yaml'

const TRANSLATABLE_KEYS = new Set(['title', 'description', 'summary', 'briefComment'])

function pickEnv() {
  return {
    baseUrl: process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1',
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'deepseek-chat',
  }
}

async function callLlm({ baseUrl, apiKey, model }, payload) {
  const systemPrompt =
    'You are a translator for a personal blog. Translate Chinese content into clear, idiomatic English. ' +
    'Preserve Markdown formatting. Output ONLY the translated content — no commentary, no code fences.'
  const userPrompt = [
    'Translate the following object\'s TRANSLATABLE string fields (title, description, summary, briefComment) and the body to English.',
    'Return a JSON object with the same shape: every non-translatable key is echoed unchanged; translatable keys are translated.',
    'JSON input:',
    JSON.stringify(payload, null, 2),
  ].join('\n')
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`LLM ${res.status}: ${t.slice(0, 200)}`)
  }
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('LLM returned empty content')
  return JSON.parse(content)
}

function splitFrontmatter(md) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(md)
  if (!m) throw new Error('no frontmatter in zh-cn.md')
  return { fm: YAML.parse(m[1]), body: m[2] }
}

function renderEnMd(fm, body) {
  return `---\n${YAML.stringify(fm).trimEnd()}\n---${body.startsWith('\n') ? body : '\n' + body}`
}

export async function translateOne(repoRoot, slug, collection) {
  const env = pickEnv()
  const dir = path.join(repoRoot, 'src', 'content', collection, slug)
  const zhPath = path.join(dir, 'zh-cn.md')
  const enPath = path.join(dir, 'en.md')
  if (!(await fs.access(zhPath).then(() => true).catch(() => false))) {
    console.log(`translate: ${zhPath} missing, skip`)
    return
  }
  const md = await fs.readFile(zhPath, 'utf8')
  const { fm, body } = splitFrontmatter(md)

  // Build translatable payload
  const tmpl = {}
  for (const k of Object.keys(fm)) {
    if (TRANSLATABLE_KEYS.has(k) && typeof fm[k] === 'string' && fm[k]) {
      tmpl[k] = fm[k]
    } else {
      tmpl[k] = fm[k]
    }
  }
  tmpl.__body = body

  if (!env.apiKey) {
    console.warn('translate: LLM_API_KEY not set, writing placeholder en.md')
    await fs.writeFile(
      enPath,
      `---\n${YAML.stringify({ ...fm, title: fm.title + ' (EN pending)' }).trimEnd()}\n---\n\n# TODO: translate\n`,
      'utf8',
    )
    return
  }

  try {
    const out = await callLlm(env, tmpl)
    const newFm = { ...fm }
    for (const k of Object.keys(tmpl)) {
      if (k === '__body') continue
      if (TRANSLATABLE_KEYS.has(k) && typeof out[k] === 'string') {
        newFm[k] = out[k]
      }
    }
    const newBody = typeof out.__body === 'string' ? out.__body : '\n# TODO: translate\n'
    await fs.writeFile(enPath, renderEnMd(newFm, newBody), 'utf8')
    console.log(`✅ translated → ${path.relative(repoRoot, enPath)}`)
  } catch (err) {
    console.warn(`translate: LLM failed (${err.message}); falling back to placeholder`)
    await fs.writeFile(
      enPath,
      `---\n${YAML.stringify({ ...fm, title: fm.title + ' (EN pending)' }).trimEnd()}\n---\n\n# TODO: translate\n`,
      'utf8',
    )
  }
}

async function main() {
  const repoRoot = process.env.CMS_REPO_ROOT || process.cwd()
  const args = process.argv.slice(2)
  // Two forms: translate.mjs <repoRoot> <slug> <collection>  OR  --all
  if (args[0] === '--all') {
    const files = await fg('src/content/*/*/zh-cn.md', { cwd: repoRoot })
    for (const f of files) {
      const parts = f.split('/')
      const collection = parts[2]
      const slug = parts[3]
      await translateOne(repoRoot, slug, collection)
    }
    return
  }
  const [, slug, collection] = args
  if (!slug || !collection) {
    console.error('Usage: translate.mjs <repoRoot> <slug> <collection>  OR  --all')
    process.exit(1)
  }
  await translateOne(repoRoot, slug, collection)
}

main().catch((err) => {
  console.error('translate crashed:', err)
  process.exit(1)
})
