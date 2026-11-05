import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const presets = ['web-vite', 'web-nuxt', 'both-vite', 'both-nuxt', 'mobile']
const managers = ['npm', 'pnpm', 'yarn']
const examples = ['welcome', 'directory']
const representativeCreators = [
  { preset: 'web-vite', 'package-manager': 'npm', example: 'welcome' },
  { preset: 'web-nuxt', 'package-manager': 'pnpm', example: 'directory' },
  { preset: 'both-vite', 'package-manager': 'yarn', example: 'directory' },
  { preset: 'both-nuxt', 'package-manager': 'npm', example: 'welcome' },
  { preset: 'mobile', 'package-manager': 'yarn', example: 'welcome' },
]

// Unknown paths and unavailable history deliberately retain the runtime checks.
export function planChecks({ files = [], full = false, headBranch = '' } = {}) {
  full ||= headBranch.startsWith('release/')
  const docsOnly =
    !full &&
    files.length > 0 &&
    files.every((file) =>
      /^(docs\/|README(?:\.[^/]+)?$|\.github\/workflows\/deploy\.yml$|playwright\.site\.config\.ts$|test\/browser\/docs[^/]*\.browser\.ts$)/.test(
        file,
      ),
    )
  const creators = full
    ? presets.flatMap((preset) =>
        managers.flatMap((manager) =>
          examples.map((example) => ({
            preset,
            'package-manager': manager,
            example,
          })),
        ),
      )
    : representativeCreators
  const browsers = docsOnly
    ? [{ project: 'chromium', shard: '1/1', scope: 'docs' }]
    : [
        ...['chromium', ...(full ? ['webkit'] : [])].flatMap((project) =>
          ['1/2', '2/2'].map((shard) => ({ project, shard, scope: 'all' })),
        ),
        ...(full ? [{ project: 'firefox-motion', shard: '1/1', scope: 'all' }] : []),
      ]
  const performance =
    !docsOnly &&
    (full ||
      files.length === 0 ||
      files.some((file) =>
        /(^package(?:-lock)?\.json$|^packages\/(core|web)\/|^examples\/catalog-web\/|^test\/performance\/|^scripts\/check-web-performance\.mjs$|^\.github\/workflows\/ci\.yml$|^scripts\/ci-plan\.mjs$)/.test(
          file,
        ),
      ))
  return {
    full,
    docsOnly,
    integration: !docsOnly,
    performance,
    browsers: { include: browsers },
    creators: { include: creators },
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let files = []
  const { CI_BASE, CI_HEAD, CI_HEAD_BRANCH, CI_FULL, GITHUB_OUTPUT, GITHUB_STEP_SUMMARY } =
    process.env
  if (CI_BASE && CI_HEAD && !/^0+$/.test(CI_BASE)) {
    try {
      files = execFileSync(
        'git',
        ['diff', '--no-renames', '--name-only', '-z', CI_BASE, CI_HEAD, '--'],
        {
          encoding: 'utf8',
        },
      )
        .split('\0')
        .filter(Boolean)
    } catch {
      console.warn('Diff unavailable; keeping the runtime and consumer checks.')
    }
  }
  const plan = planChecks({ files, full: CI_FULL === 'true', headBranch: CI_HEAD_BRANCH })
  console.log(JSON.stringify(plan, null, 2))
  if (GITHUB_OUTPUT) {
    for (const [name, value] of Object.entries(plan)) {
      appendFileSync(GITHUB_OUTPUT, `${name}=${JSON.stringify(value)}\n`)
    }
  }
  if (GITHUB_STEP_SUMMARY) {
    appendFileSync(
      GITHUB_STEP_SUMMARY,
      [
        `Mode: **${plan.full ? 'full (release/manual)' : plan.docsOnly ? 'documentation' : 'PR'}**`,
        `Browser jobs: ${plan.browsers.include.map(({ project, shard }) => `${project} ${shard}`).join(', ')}.`,
        `CLI consumers: ${plan.integration ? plan.creators.include.length : 0}; package/Nuxt consumers: ${plan.integration}; performance: ${plan.performance}.`,
        'Full mode retains all browser engines and all 30 CLI combinations. See test/ci.md.',
        '',
      ].join('\n\n'),
    )
  }
}
