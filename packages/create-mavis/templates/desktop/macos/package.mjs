import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
if (process.platform !== 'darwin' || process.arch !== 'arm64')
  throw new Error('Package on macOS arm64.')
if (Number(process.versions.node.split('.')[0]) < 22)
  throw new Error('Build with Node 22 or newer.')
const output = resolve(here, 'artifacts/__MAVIS_NAME__.app')
rmSync(output, { recursive: true, force: true })
const macos = join(output, 'Contents/MacOS')
const resources = join(output, 'Contents/Resources')
mkdirSync(macos, { recursive: true })
mkdirSync(resources, { recursive: true })
cpSync(process.execPath, join(macos, 'node'))
cpSync(join(here, 'dist/main.mjs'), join(resources, 'dist/main.mjs'))
cpSync(join(here, 'launch.mjs'), join(resources, 'launch.mjs'))
cpSync(join(here, 'node_modules/@nativescript'), join(resources, 'node_modules/@nativescript'), {
  recursive: true,
})
writeFileSync(
  join(output, 'Contents/Info.plist'),
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>org.nativescript.__MAVIS_APPID__</string>
<key>CFBundleName</key><string>__MAVIS_NAME__</string>
<key>CFBundleExecutable</key><string>MavisDesktop</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleVersion</key><string>1</string>
<key>CFBundleShortVersionString</key><string>0.0.1</string>
<key>LSMinimumSystemVersion</key><string>13.3</string>
<key>NSHighResolutionCapable</key><true/>
</dict></plist>
`,
)
// exec preserves signals/exit status. Every runtime path is relative to this app,
// so launching needs neither a globally installed Node nor an Edge/dev server.
const source = join(here, 'artifacts/launcher.c')
writeFileSync(
  source,
  `#include <mach-o/dyld.h>
#include <limits.h>
#include <libgen.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
int main(int argc, char **argv) {
  char executable[PATH_MAX], node[PATH_MAX], script[PATH_MAX];
  uint32_t size = sizeof(executable);
  if (_NSGetExecutablePath(executable, &size) != 0) return 1;
  char *directory = dirname(executable);
  snprintf(node, sizeof(node), "%s/node", directory);
  snprintf(script, sizeof(script), "%s/../Resources/launch.mjs", directory);
  char **args = calloc((size_t)argc + 2, sizeof(char *));
  if (!args) return 1;
  args[0] = node; args[1] = script;
  for (int i = 1; i < argc; i++) args[i + 1] = argv[i];
  execv(node, args);
  perror("__MAVIS_NAME__ launch");
  return 1;
}
`,
)
execFileSync(
  'xcrun',
  ['clang', '-mmacosx-version-min=13.3', source, '-o', join(macos, 'MavisDesktop')],
  { stdio: 'inherit' },
)
const licenses = join(resources, 'Licenses')
mkdirSync(licenses)
for (const [name, path] of [
  ['Mavis', 'LICENSE'],
  ['Vue', 'node_modules/vue/LICENSE'],
  ['VueRouter', 'node_modules/vue-router/LICENSE'],
  ['Jolt', 'node_modules/@rafaelaugusto/jolt/LICENSE'],
  ['NativeScript', 'node_modules/@nativescript/macos-node-api/LICENSE'],
  ['NativeScriptObjC', 'node_modules/@nativescript/objc-node-api/LICENSE'],
])
  cpSync(resolve(here, path), join(licenses, `${name}.txt`))
cpSync(resolve(dirname(process.execPath), '../LICENSE'), join(licenses, 'Node.txt'))
const native = join(
  resources,
  'node_modules/@nativescript/macos-node-api/build/RelWithDebInfo/NativeScript.apple.node/macos-arm64/NativeScript.framework',
)
// npm omits symlinks. Reconstruct the versioned framework layout in the copy
// before codesigning; the installed dependency is never modified.
symlinkSync('A', join(native, 'Versions/Current'))
for (const entry of ['NativeScript', 'Resources', 'Headers'])
  symlinkSync(`Versions/Current/${entry}`, join(native, entry))
for (const target of [native, join(macos, 'node'), join(macos, 'MavisDesktop'), output])
  execFileSync('codesign', ['--force', '--sign', '-', target], { stdio: 'inherit' })
execFileSync('codesign', ['--verify', '--deep', '--strict', output], { stdio: 'inherit' })
writeFileSync(
  join(here, 'artifacts/package.json'),
  JSON.stringify(
    {
      app: output,
      node: process.version,
      runtime: JSON.parse(
        readFileSync(join(here, 'node_modules/@nativescript/macos-node-api/package.json'), 'utf8'),
      ).version,
      arch: process.arch,
      minimumMacOS: '13.3',
      signing: 'ad-hoc; not notarized',
    },
    null,
    2,
  ) + '\n',
)
console.log(output)
