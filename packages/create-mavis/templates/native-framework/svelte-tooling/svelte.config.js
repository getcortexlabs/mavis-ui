// Use the project's pinned TypeScript for both svelte-check and webpack.
// svelte-check's default preprocessor can resolve a different TypeScript peer.
const ts = require('typescript')
module.exports = {
  preprocess: {
    script: ({ content, attributes, filename }) => {
      if (attributes.lang !== 'ts') return undefined
      const result = ts.transpileModule(content, {
        fileName: filename,
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
          verbatimModuleSyntax: true,
          sourceMap: true,
        },
      })
      return { code: result.outputText, map: result.sourceMapText }
    },
  },
}
