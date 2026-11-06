import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

mkdirSync('artifacts/ssr', { recursive: true })
const directory = mkdtempSync(join(tmpdir(), 'mavis-core-contracts-'))
const manifest = JSON.parse(readFileSync('artifacts/release/packages/manifest.json', 'utf8'))
const entry = manifest.find(({ name }) => name === '@getcortexlabs/mavis-core')
const json = (name, value) => writeFileSync(join(directory, name), JSON.stringify(value, null, 2))
json('package.json', {
  private: true,
  type: 'module',
  dependencies: { [entry.name]: `file:${resolve('artifacts/release/packages', entry.filename)}` },
  devDependencies: { typescript: '6.0.3' },
})
json('tsconfig.json', {
  compilerOptions: {
    target: 'ES2022',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    strict: true,
    noEmit: true,
    lib: ['ES2023'],
    types: [],
    skipLibCheck: false,
  },
  include: ['consumer.ts'],
})
writeFileSync(
  join(directory, 'consumer.ts'),
  `
import { componentContracts, describeContract, targetCapabilities, themeContract } from '@getcortexlabs/mavis-core'
import type { ContractProps, InputEvents, TextInputHandle } from '@getcortexlabs/mavis-core'
import { createFormController, createFileSelection, pagination, isCivilDate } from '@getcortexlabs/mavis-core'
import type { ComboboxSearch, FilePickerAdapter, CivilDate, StepOption } from '@getcortexlabs/mavis-core'
import type { RefreshAction } from '@getcortexlabs/mavis-core'
const refresh: RefreshAction = async ({ signal, commit }) => {
  signal.addEventListener('abort', () => {}, { once: true })
  signal.throwIfAborted()
  if (!signal.aborted) await commit(() => {})
}
void refresh
const civil: CivilDate = '2026-11-12'
const search: ComboboxSearch = async (_query, context) => { context.onCancel(() => {}); return [] }
const form = createFormController(); form.dispose()
const files = createFileSelection(); files.dispose()
void [civil, search, pagination(100, 20, 1), isCivilDate(civil)]
const props: ContractProps<typeof componentContracts.MInput.props> = { label: 'Name', modelValue: 'Ada' }
// @ts-expect-error A framework-free input still requires a label.
const invalid: ContractProps<typeof componentContracts.MInput.props> = { modelValue: 'Ada' }
function focus(handle: TextInputHandle, events: InputEvents) { handle.focus(); events.valueChange('Ada') }
void [props, invalid, focus, describeContract('MInput'), targetCapabilities, themeContract]
`,
)
const run = (args) => execFileSync('npm', args, { cwd: directory, stdio: 'inherit' })
run(['install', '--no-audit', '--no-fund'])
run(['exec', '--', 'tsc'])
const lock = readFileSync(join(directory, 'package-lock.json'), 'utf8')
assert(
  !/node_modules\/(?:vue|@vue\/|@nativescript\/|nativescript-vue|react|@rafaelaugusto\/)/.test(
    lock,
  ),
  'Core must install without a renderer or animation runtime',
)
execFileSync(
  process.execPath,
  [
    '--input-type=module',
    '-e',
    `
import assert from 'node:assert/strict'
import { describeContract, targetCapabilities, validateDateRangeDraft } from '@getcortexlabs/mavis-core'
assert.deepEqual(
  validateDateRangeDraft({ start: '2024-01-01', end: '' }, { min: '2024-02-01' }),
  { valid: false, complete: false, reason: 'before-min' },
)
assert.equal(describeContract('MInput').binding.owner, 'parent')
assert.equal(targetCapabilities.targets.length, 2)
`,
  ],
  { cwd: directory, stdio: 'inherit' },
)
writeFileSync(
  'artifacts/ssr/core-consumer.json',
  JSON.stringify({ directory, noDOM: true, noFramework: true }, null, 2),
)
console.log('Core tarball imports and typechecks without Vue, DOM, NativeScript or Jolt')
