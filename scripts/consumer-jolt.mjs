import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
export function consumerJolt(published) {
  const config = JSON.parse(readFileSync('jolt-candidate.json', 'utf8'))
  if (!config) return published
  if (!existsSync('artifacts/jolt-candidate.json'))
    throw new Error('Run node scripts/prepare-jolt-candidate.mjs before consumer validation.')
  const candidate = JSON.parse(readFileSync('artifacts/jolt-candidate.json', 'utf8'))
  if (candidate.commit !== config.commit || !existsSync(candidate.tarball))
    throw new Error('The prepared Jolt candidate does not match the pinned commit.')
  const integrity = `sha512-${createHash('sha512').update(readFileSync(candidate.tarball)).digest('base64')}`
  if (candidate.integrity !== integrity)
    throw new Error('The prepared Jolt candidate bytes have changed.')
  return `file:${candidate.tarball}`
}
