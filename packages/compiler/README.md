# @getcortexlabs/mavis-compiler

Experimental compiler for shared Mavis Vue SFCs and TSX. It produces native SwiftUI for macOS without a WebView or JavaScript runtime, and Vue output for Web and NativeScript when needed.

The creator pins this package to the Mavis version. Generated projects contain a small `scripts/generate.mjs` entry, not a private compiler copy. Upgrade Mavis and the compiler together.

```js
import { compileProject, readShared, generateProject } from '@getcortexlabs/mavis-compiler'
const files = await readShared(process.cwd(), { roots: ['shared'] })
const output = await compileProject(files, { root: 'shared/screens/Home.vue' })
// Or generate the targets configured by mavis.config.json:
await generateProject(process.cwd())
```

`readShared` reads configured project-relative roots recursively, refuses symlinks and paths outside the project, and keeps original paths in diagnostics. Components must have unique PascalCase file names; modules use lowercase names. Unsupported syntax fails with a source location rather than falling back to JavaScript on the Mac.

The supported source subset remains experimental. See the [Mac guide](https://mavis-ui.getcortexlabs.com/guide/macos-experimental) for host services, platform boundaries and validation.
