/**
 * parse-issue.mjs — turn a GitHub issue payload into a normalized JSON
 *
 * Input:
 *   - GitHub event JSON file (or stdin) — $GITHUB_EVENT_PATH equivalent
 *   - The issue must have been created from a form template that includes
 *     a leading "category" field (one of: blog, book, book-review, column, article).
 *
 * Output:
 *   - writes .cms-tmp/payload.json with shape { category, slug, payload }
 *   - exits 0 on success, 1 on parse error
 *
 * Body parsing strategy:
 *   GitHub issue forms render the body with hidden HTML comments of the form:
 *     ### Tasklist
 *     <!-- tasklist -->
 *     - [x] something
 *
 *   For form templates (checkboxes/dropdown/input), the form fields are NOT in
 *   hidden comments — they're rendered as a structured YAML-ish block. We
 *   parse a custom convention: the issue body MUST start with a fenced YAML
 *   block ```yaml ... ```. Inside that block the user fills category + fields.
 *
 *   This is a pragmatic choice that works without depending on GitHub's
 *   unstable internal form-rendering format.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'
import { lexer } from 'marked'
import { categorySchema, schemaByCategory } from './schemas.mjs'

async function readEvent(eventPath) {
  if (eventPath && eventPath !== '-') {
    const raw = await fs.readFile(eventPath, 'utf8')
    return JSON.parse(raw)
  }
  const chunks = []
  for await (const c of process.stdin) chunks.push(c)
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function extractYamlBlock(body) {
  if (!body) throw new Error('issue body is empty')
  const tokens = lexer(body)
  const index = tokens.findIndex(token => token.type === 'code' && token.lang === 'yaml')
  if (index < 0) {
    throw new Error(
      'issue body must start with a fenced ```yaml ... ``` block (this is a CMS issue template requirement)',
    )
  }
  return {
    yaml: tokens[index].text,
    trailingBody: tokens.slice(index + 1).map(token => token.raw).join('').trim(),
  }
}

/**
 * GitHub renders issue-form textareas with `render: yaml` by adding 2-space
 * indent to every line AFTER the first. yaml 1.2 then sees the first un-indented
 * line as a compact mapping and rejects subsequent indented lines as nested
 * mappings ("Nested mappings are not allowed in compact mappings").
 * Normalize by stripping leading whitespace from every non-empty line.
 */
function normalizeYamlIndent(text) {
  const lines = text.split('\n')
  // detect: first line has no leading whitespace, second line does
  if (lines.length > 1 && lines[0].length > 0 && /^\s+\S/.test(lines[1])) {
    return lines.map(l => l.replace(/^\s+/, '')).join('\n')
  }
  return text
}

/**
 * Split yaml text at the first `body: |` (or `body: >`) sentinel. Everything
 * before becomes the frontmatter map; everything after becomes the markdown body.
 * This is the safe boundary because the sentinel only appears once, and zod
 * schemas don't allow a `body` field at the top level.
 */
function splitOnBodySentinel(yamlText) {
  // match a top-level (no-indent) `body:` line followed by '|' or '>'
  const m = /^(body:\s*[|>][+-]?\s*)$/m.exec(yamlText)
  if (!m) {
    return { frontmatter: yamlText, body: '' }
  }
  const idx = m.index
  const frontmatter = yamlText.slice(0, idx).replace(/\s+$/, '')
  const body = yamlText.slice(idx + m[0].length).replace(/^\s+/, '')
  return { frontmatter, body }
}

export function parseIssueBody(body) {
  const { yaml, trailingBody } = extractYamlBlock(body)
  const rawYaml = normalizeYamlIndent(yaml)
  const { frontmatter, body: bodyContent } = splitOnBodySentinel(rawYaml)
  const obj = YAML.parse(frontmatter)
  if (!obj || typeof obj !== 'object') {
    throw new Error('YAML block did not parse to an object')
  }
  const category = obj.category
  const cat = categorySchema.parse(category)
  const schema = schemaByCategory[cat]
  // Pull only known fields (drop body sentinel, it's the markdown body)
  const raw = { ...obj }
  delete raw.category
  delete raw.body
  const payload = schema.parse(raw)
  return { category: cat, payload: { ...payload, body: [bodyContent, trailingBody].filter(Boolean).join('\n\n') } }
}

async function main() {
  const eventPath = process.argv[2] || process.env.GITHUB_EVENT_PATH
  if (!eventPath) {
    console.error('Usage: parse-issue.mjs <event.json>  (or set GITHUB_EVENT_PATH)')
    process.exit(1)
  }
  const event = await readEvent(eventPath)
  const issueBody = event?.issue?.body ?? event?.comment?.body ?? ''
  let parsed
  try {
    parsed = parseIssueBody(issueBody)
  } catch (err) {
    console.error(`❌ parse failed: ${err.message}`)
    process.exit(1)
  }
  const out = {
    issueNumber: event?.issue?.number,
    issueTitle: event?.issue?.title,
    issueAuthor: event?.issue?.user?.login,
    ...parsed,
  }
  const outDir = path.resolve('.cms-tmp')
  await fs.mkdir(outDir, { recursive: true })
  const outPath = path.join(outDir, 'payload.json')
  await fs.writeFile(outPath, JSON.stringify(out, null, 2), 'utf8')
  console.log(`✅ parsed → ${outPath}`)
  console.log(`   category=${out.category}  slug=${out.payload.slug}`)
}

// Only run main() when invoked as a CLI (not when imported by tests)
const isCli = import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` ||
              process.argv[1]?.endsWith('parse-issue.mjs')
if (isCli) {
  main().catch((err) => {
    console.error('parse-issue crashed:', err)
    process.exit(1)
  })
}
