#!/usr/bin/env node
/**
 * git-push.mjs — commit rendered files to CMS_TARGET_BRANCH (default main)
 *
 * Steps:
 *   1. git checkout <target>  (defaults to env CMS_TARGET_BRANCH, falls back to 'main')
 *   2. git pull --ff-only
 *   3. (files have already been written by render.mjs)
 *   4. git add <changed paths>
 *   5. git commit -m "cms(<category>): add <slug> (Refs #<n>)"
 *   6. git push origin <target>
 *   7. Comment on issue via Octokit: "✅ pushed to <target> @ <sha>"
 *
 * Refuses to push to `main` if CMS_TARGET_BRANCH env explicitly says otherwise
 * (double safety in addition to the workflow env).
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { Octokit } from '@octokit/rest'

const exec = promisify(execFile)
const targetBranch = process.env.CMS_TARGET_BRANCH || 'main'

async function main() {
  const payloadPath = process.argv[2] || '.cms-tmp/payload.json'
  const repoRoot = process.env.CMS_REPO_ROOT || process.cwd()
  const obj = JSON.parse(await fs.readFile(payloadPath, 'utf8'))
  const { category, payload, issueNumber } = obj

  console.log(`git-push: target branch = ${targetBranch}`)
  if (targetBranch === 'main' && process.env.CMS_REQUIRE_TEST_BRANCH === '1') {
    throw new Error('Refusing to push to main while CMS_REQUIRE_TEST_BRANCH=1')
  }

  // Configure git author (the GITHUB_TOKEN's bot identity)
  await exec('git', ['config', 'user.name', 'cms-bot'], { cwd: repoRoot })
  await exec('git', ['config', 'user.email', 'cms-bot@users.noreply.github.com'], { cwd: repoRoot })

  // Ensure target branch exists locally (checkout -B is safe)
  await exec('git', ['fetch', 'origin'], { cwd: repoRoot })
  try {
    await exec('git', ['checkout', targetBranch], { cwd: repoRoot })
  } catch {
    await exec('git', ['checkout', '-b', targetBranch, `origin/${targetBranch}`], { cwd: repoRoot })
  }
  await exec('git', ['pull', '--ff-only', 'origin', targetBranch], { cwd: repoRoot })

  // The files are already on disk (rendered by render.mjs earlier in the workflow).
  // We just stage and commit.
  const relativeFiles = await discoverChangedFiles(repoRoot, category, payload.slug)
  if (relativeFiles.length === 0) {
    console.log('git-push: no changed files to commit (already up to date?)')
    return
  }
  await exec('git', ['add', '--', ...relativeFiles], { cwd: repoRoot })

  // Avoid empty commit if user already manually committed
  const status = await exec('git', ['status', '--porcelain'], { cwd: repoRoot })
  if (!status.stdout.trim()) {
    console.log('git-push: nothing to commit')
    return
  }

  const msg = `cms(${category}): add ${payload.slug} (Refs #${issueNumber ?? '?'})`
  await exec('git', ['commit', '-m', msg], { cwd: repoRoot })
  await exec('git', ['push', 'origin', targetBranch], { cwd: repoRoot })

  const sha = (await exec('git', ['rev-parse', 'HEAD'], { cwd: repoRoot })).stdout.trim()
  console.log(`✅ pushed ${sha.slice(0, 7)} → origin/${targetBranch}`)

  // Comment on the issue (only if we have all the bits)
  if (issueNumber && process.env.GITHUB_TOKEN && process.env.GH_REPO) {
    const [owner, repo] = process.env.GH_REPO.split('/')
    const oct = new Octokit({ auth: process.env.GITHUB_TOKEN })
    try {
      await oct.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: `✅ CMS push: \`${category}/${payload.slug}\` → \`origin/${targetBranch}\` @ \`${sha.slice(0, 7)}\``,
      })
    } catch (err) {
      console.warn(`comment failed: ${err.message}`)
    }
  }
}

async function discoverChangedFiles(repoRoot, category, slug) {
  // All files in src/content/<dir>/<slug>/ that are not gitignored
  // Use git status --porcelain for accuracy.
  const status = (await exec('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: repoRoot }))
    .stdout
  return status
    .split('\n')
    .filter(Boolean)
    .map((line) => line.replace(/^(..)\s+/, '').trim().replace(/^"(.*)"$/, '$1'))
    .filter((p) => p.startsWith('src/content/'))
}

main().catch((err) => {
  console.error('git-push failed:', err.message ?? err)
  process.exit(1)
})
