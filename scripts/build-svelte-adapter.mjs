import { readFile, readdir, writeFile, copyFile } from 'node:fs/promises'
import { compile, preprocess } from 'svelte/compiler'
import ts from 'typescript'

const source = new URL('../packages/svelte-nativescript/src/', import.meta.url)
const dist = new URL('../packages/svelte-nativescript/dist/', import.meta.url)
for (const file of await readdir(source)) {
  if (file.endsWith('.svelte.d.ts')) await copyFile(new URL(file, source), new URL(file, dist))
  if (!file.endsWith('.svelte')) continue
  const filename = new URL(file, source).pathname
  const input = await preprocess(await readFile(filename, 'utf8'), {
    script: ({ content, attributes }) => attributes.lang === 'ts' ? {
      code: ts.transpileModule(content, { compilerOptions: {
        target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, verbatimModuleSyntax: true,
      }}).outputText,
    } : undefined,
  }, { filename })
  const result = compile(input.code, { filename, namespace: 'foreign', generate: 'dom', css: 'external', dev: false })
  const errors = result.warnings.filter(warning => !['missing-declaration'].includes(warning.code))
  if (errors.length) throw new Error(`${file}: ${errors.map(x => x.message).join('\n')}`)
  await writeFile(new URL(`${file}.js`, dist), result.js.code + '\n')
}
