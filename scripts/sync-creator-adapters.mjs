// Writes the framework adapters the creator knows about from Mavis core's capabilities,
// so the creator has no list of its own to drift. A unit test compares the two.
//
//   npm run build --workspace @getcortexlabs/mavis-core && node scripts/sync-creator-adapters.mjs
import { writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve(import.meta.dirname, '..')

/** The part of core's targetCapabilities the creator resolves choices from. */
export function creatorAdapters(capabilities) {
  return {
    available: capabilities.targets.map(({ id, framework, renderer, status, rendering }) => ({
      id,
      framework,
      renderer,
      status,
      rendering: Object.entries(rendering)
        .filter(([, state]) => state !== 'unsupported')
        .map(([mode]) => mode),
    })),
    planned: capabilities.planned.map(({ id, issue }) => ({ id, issue })),
    research: capabilities.research.map(({ id, issue }) => ({ id, issue })),
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { targetCapabilities } = await import(
    pathToFileURL(join(root, 'packages/core/dist/index.js'))
  )
  writeFileSync(
    join(root, 'packages/create-mavis/src/adapters.mjs'),
    `// Generated from targetCapabilities in @getcortexlabs/mavis-core by scripts/sync-creator-adapters.mjs.\n// Do not edit: change core's capabilities and run the script.\nexport const adapters = ${JSON.stringify(creatorAdapters(targetCapabilities), null, 2)}\n`,
  )
}
