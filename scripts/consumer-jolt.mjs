import { existsSync, readFileSync } from 'node:fs'
export function consumerJolt(published) {
  const config = JSON.parse(readFileSync('jolt-candidate.json', 'utf8'))
  if (!config) return published
  if (!existsSync('artifacts/jolt-candidate.json')) throw new Error('Run node scripts/prepare-jolt-candidate.mjs before consumer validation.')
  const candidate = JSON.parse(readFileSync('artifacts/jolt-candidate.json', 'utf8'))
  if (candidate.commit !== config.commit || !existsSync(candidate.tarball)) throw new Error('The prepared Jolt candidate does not match the pinned commit.')
  return `file:${candidate.tarball}`
}
