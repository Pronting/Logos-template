#!/usr/bin/env node
import { promises as fs } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import fg from 'fast-glob'
import YAML from 'yaml'

const PROMPT_VERSION = 'ai-summary-v2'
const SUMMARY_DIR = path.join('src', 'data', 'ai-summaries')
const DEFAULT_BASE_URL = 'https://api.deepseek.com/v1'
const DEFAULT_API_PATH = '/chat/completions'
const DEFAULT_MODEL = 'deepseek-chat'

function parseArgs(argv) {
  const args = {
    dryRun: false,
    force: false,
    includeDrafts: false,
    limit: Number.POSITIVE_INFINITY,
    target: '',
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--force') args.force = true
    else if (arg === '--include-drafts') args.includeDrafts = true
    else if (arg === '--limit') args.limit = Number(argv[++i] || 0) || Number.POSITIVE_INFINITY
    else if (arg.startsWith('--limit=')) args.limit = Number(arg.slice('--limit='.length)) || Number.POSITIVE_INFINITY
    else if (arg === '--target') args.target = argv[++i] || ''
    else if (arg.startsWith('--target=')) args.target = arg.slice('--target='.length)
    else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    }
  }

  return args
}

function printHelp() {
  console.log(`Usage: node script/generate-ai-summaries.mjs [options]

Options:
  --dry-run           List summary targets and cache status without calling the model
  --force             Regenerate even when the cache is fresh
  --include-drafts    Include entries marked draft: true
  --limit <n>         Process at most n stale targets
  --target <key>      Process one key, e.g. blog/zh-cn/harness/ecc
`)
}

async function readDotEnv(repoRoot) {
  const envPath = path.join(repoRoot, '.env')
  const text = await fs.readFile(envPath, 'utf8').catch(() => '')
  const values = {}

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    values[key] = value
  }

  return values
}

function pickValue(localEnv, names, fallback = '') {
  for (const name of names) {
    if (typeof localEnv[name] === 'string' && localEnv[name].trim() !== '') {
      return { value: localEnv[name].trim(), source: `.env:${name}` }
    }
  }

  for (const name of names) {
    if (typeof process.env[name] === 'string' && process.env[name].trim() !== '') {
      return { value: process.env[name].trim(), source: `env:${name}` }
    }
  }

  return { value: fallback, source: fallback ? 'default' : 'missing' }
}

async function loadConfig(repoRoot) {
  const localEnv = await readDotEnv(repoRoot)
  const apiKey = pickValue(localEnv, [
    'AI_SUMMARY_API_KEY',
    'DEEPSEEK_API_KEY',
    'LLM_API_KEY',
  ])
  const baseUrl = pickValue(localEnv, [
    'AI_SUMMARY_BASE_URL',
    'DEEPSEEK_BASE_URL',
    'LLM_BASE_URL',
  ], DEFAULT_BASE_URL)
  const apiUrl = pickValue(localEnv, [
    'AI_SUMMARY_API_URL',
    'DEEPSEEK_API_URL',
    'LLM_API_URL',
  ])
  const apiPath = pickValue(localEnv, [
    'AI_SUMMARY_API_PATH',
    'DEEPSEEK_API_PATH',
    'LLM_API_PATH',
  ], DEFAULT_API_PATH)
  const model = pickValue(localEnv, [
    'AI_SUMMARY_MODEL',
    'DEEPSEEK_MODEL',
    'LLM_MODEL',
  ], DEFAULT_MODEL)
  const temperature = pickValue(localEnv, ['AI_SUMMARY_TEMPERATURE'], '0.2')
  const maxInputChars = pickValue(localEnv, ['AI_SUMMARY_MAX_INPUT_CHARS'], '18000')

  return {
    apiKey: apiKey.value,
    baseUrl: baseUrl.value,
    apiUrl: apiUrl.value,
    apiPath: apiPath.value,
    model: model.value,
    temperature: Number(temperature.value) || 0.2,
    maxInputChars: Number(maxInputChars.value) || 18000,
    sources: {
      apiKey: apiKey.source,
      baseUrl: baseUrl.source,
      apiUrl: apiUrl.source,
      apiPath: apiPath.source,
      model: model.source,
      temperature: temperature.source,
      maxInputChars: maxInputChars.source,
    },
  }
}

function splitFrontmatter(markdown, file) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(markdown)
  if (!match) {
    return { data: {}, body: markdown }
  }

  try {
    return { data: YAML.parse(match[1]) || {}, body: match[2] || '' }
  } catch (err) {
    throw new Error(`${file}: invalid frontmatter (${err.message})`)
  }
}

function normalizeSlash(value) {
  return value.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
}

function stripMarkdownForPrompt(body) {
  return body
    .replace(/```[\s\S]*?```/g, (block) => {
      const firstLine = block.split(/\r?\n/, 1)[0] || '```'
      return `${firstLine}\n[code block omitted for summary]\n\`\`\``
    })
    .replace(/!\[[^\]]*]\([^)]+\)/g, '[image omitted]')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .trim()
}

function hashContent(target) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({
      type: target.type,
      locale: target.locale,
      id: target.id,
      title: target.title,
      tags: target.tags,
      body: target.body,
    }))
    .digest('hex')
}

function summaryKeyToFileName(key) {
  return `${encodeURIComponent(key).replace(/[^A-Za-z0-9_.-]/g, (ch) => {
    return `_${ch.charCodeAt(0).toString(16)}_`
  })}.json`
}

function createSummaryKey(type, locale, id) {
  return `${type}/${locale}/${normalizeSlash(id)}`
}

async function collectMarkdownTargets(repoRoot, includeDrafts) {
  const files = await fg([
    'src/content/blog/**/[^_]*.md',
    'src/content/book-review/**/[^_]*.md',
    'src/content/columns/**/[^_]*.md',
  ], { cwd: repoRoot, onlyFiles: true })

  const targets = []

  for (const file of files.sort()) {
    const absolute = path.join(repoRoot, file)
    const markdown = await fs.readFile(absolute, 'utf8')
    const { data, body } = splitFrontmatter(markdown, file)
    if (!includeDrafts && data.draft === true) continue

    const rel = normalizeSlash(file)
    const parts = rel.split('/')
    const collection = parts[2]
    const fileName = parts[parts.length - 1]
    const locale = fileName.replace(/\.md$/, '')
    const id = parts.slice(3, -1).join('/')

    if (!id || !locale || body.trim() === '') continue

    let type = ''
    if (collection === 'blog') {
      type = 'blog'
    } else if (collection === 'book-review') {
      type = 'bookReview'
    } else if (collection === 'columns') {
      if (id.split('/').length < 2) continue
      type = 'columnArticle'
    } else {
      continue
    }

    targets.push({
      type,
      locale,
      id,
      key: createSummaryKey(type, locale, id),
      title: String(data.title || id),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      body,
      sourcePath: file,
    })
  }

  return targets
}

async function readExistingSummary(repoRoot, key) {
  const file = path.join(repoRoot, SUMMARY_DIR, summaryKeyToFileName(key))
  const text = await fs.readFile(file, 'utf8').catch(() => '')
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function writeSummary(repoRoot, record) {
  const dir = path.join(repoRoot, SUMMARY_DIR)
  await fs.mkdir(dir, { recursive: true })
  const file = path.join(dir, summaryKeyToFileName(`${record.target.type}/${record.target.locale}/${record.target.id}`))
  await fs.writeFile(file, `${JSON.stringify(record, null, 2)}\n`, 'utf8')
}

function buildEndpoint(config) {
  if (config.apiUrl) return config.apiUrl
  return `${config.baseUrl.replace(/\/$/, '')}/${config.apiPath.replace(/^\//, '')}`
}

function truncateForPrompt(text, maxChars) {
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars)}\n\n[The article is longer than the input budget; summarize only from the provided excerpt and do not invent missing details.]`
}

function extractMarkdownHeadings(body) {
  return body
    .split(/\r?\n/)
    .map((line) => /^#{1,3}\s+(.+)$/.exec(line.trim())?.[1]?.trim())
    .filter(Boolean)
    .slice(0, 12)
}

function buildMessages(target, config) {
  const isChinese = target.locale.toLowerCase().startsWith('zh')
  const languageRule = isChinese
    ? '请使用简体中文输出。'
    : 'Write the summary in English.'
  const cleanedBody = stripMarkdownForPrompt(target.body)
  const compactBody = truncateForPrompt(cleanedBody, config.maxInputChars)
  const bodyChars = [...cleanedBody].length
  const headings = extractMarkdownHeadings(target.body)

  const systemPrompt = [
    'You are an assistant that writes concise summaries for a personal blog.',
    'Summarize only what is explicitly present in the article. Do not add facts, assumptions, praise, or marketing language.',
    'The summary should help readers quickly decide whether to read the full article.',
    'Choose summary length by information density, not by a fixed target:',
    '- Very short or single-point notes under 600 characters: 40-110 Chinese characters, or equivalent English length.',
    '- Short but complete notes around 600-1500 characters with few sections: 100-190 Chinese characters, or equivalent English length.',
    '- Normal articles above 1500 characters or with 2+ headings: 220-360 Chinese characters, or equivalent English length.',
    '- Dense essays above 3000 characters or with 4+ headings: 300-480 Chinese characters, or equivalent English length.',
    'For non-trivial articles, do not return a one-sentence summary. Use one cohesive paragraph with 3-5 sentences.',
    'For articles with headings, cover the main sections proportionally: thesis, key reasoning, important examples/context, and conclusion or implication.',
    'If the article is genuinely thin, keep it short. Do not pad with decorative language just to reach a number.',
    'Avoid empty phrases such as "深入探讨", "全面分析", "具有重要意义", "值得一读", unless the source itself says so.',
    'Do not output a title, bullets, Markdown, code fences, or commentary. Output JSON only: {"summary":"..."}',
    languageRule,
  ].join('\n')

  const userPrompt = [
    `Title: ${target.title}`,
    `Tags: ${target.tags.length > 0 ? target.tags.join(', ') : 'none'}`,
    `Source path: ${target.sourcePath}`,
    `Approximate body characters: ${bodyChars}`,
    `Headings: ${headings.length > 0 ? headings.join(' | ') : 'none'}`,
    '',
    'Article body:',
    compactBody,
  ].join('\n')

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}

async function callModel(config, target) {
  const endpoint = buildEndpoint(config)
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: config.temperature,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
      messages: buildMessages(target, config),
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LLM ${res.status}: ${text.slice(0, 500)}`)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('LLM returned empty content')

  let parsed
  try {
    parsed = JSON.parse(content)
  } catch {
    parsed = { summary: content }
  }

  const summary = String(parsed.summary || '').trim()
  if (!summary) throw new Error('LLM returned empty summary')
  return summary
}

async function main() {
  const repoRoot = process.cwd()
  const args = parseArgs(process.argv.slice(2))
  const config = await loadConfig(repoRoot)
  const targets = await collectMarkdownTargets(repoRoot, args.includeDrafts)
  const selectedTargets = targets.filter((target) => !args.target || target.key === args.target)

  if (args.target && selectedTargets.length === 0) {
    console.error(`No summary target matched: ${args.target}`)
    process.exit(1)
  }

  console.log(`AI summary config: model=${config.model} (${config.sources.model}), base=${config.baseUrl} (${config.sources.baseUrl}), apiPath=${config.apiPath} (${config.sources.apiPath})`)
  console.log(`AI summary targets: ${selectedTargets.length}`)

  let processed = 0
  let skipped = 0
  let fresh = 0

  for (const target of selectedTargets) {
    const contentHash = hashContent(target)
    const existing = await readExistingSummary(repoRoot, target.key)
    const isFresh =
      !args.force &&
      existing?.contentHash === contentHash &&
      existing?.promptVersion === PROMPT_VERSION &&
      existing?.model === config.model &&
      typeof existing?.summary === 'string' &&
      existing.summary.trim() !== ''

    if (isFresh) {
      fresh += 1
      if (args.dryRun) console.log(`fresh  ${target.key}`)
      continue
    }

    if (args.dryRun) {
      console.log(`${existing ? 'stale ' : 'new   '} ${target.key} <- ${target.sourcePath}`)
      skipped += 1
      continue
    }

    if (!config.apiKey) {
      console.error('AI summary API key is missing. Set AI_SUMMARY_API_KEY in .env for local testing, or expose it as an Action secret/env variable in CI.')
      process.exit(1)
    }

    if (processed >= args.limit) {
      skipped += 1
      continue
    }

    console.log(`summarize ${target.key}`)
    const summary = await callModel(config, target)
    await writeSummary(repoRoot, {
      schemaVersion: 1,
      promptVersion: PROMPT_VERSION,
      model: config.model,
      contentHash,
      generatedAt: new Date().toISOString(),
      target: {
        type: target.type,
        locale: target.locale,
        id: target.id,
        title: target.title,
      },
      summary,
    })
    processed += 1
  }

  console.log(`AI summary done: generated=${processed}, fresh=${fresh}, skipped=${skipped}`)
}

main().catch((err) => {
  console.error('AI summary generation failed:', err)
  process.exit(1)
})
