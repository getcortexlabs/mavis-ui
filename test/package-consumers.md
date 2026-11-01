# Package consumers

Run with Node 22+, from the repository root:

```sh
npm ci
npm run release:pack
npm run release:check
```

`release:pack` builds the three packages and writes tarballs, a manifest with npm integrity values, and SHA256SUMS to `artifacts/release/packages`. It checks synchronized alpha versions, exact internal dependency versions, export targets, license copies, CSS side effects, native source files and the package file allowlist.

`release:check` creates three temporary applications outside the repository. They install the tarballs with ordinary npm dependency resolution, without workspace links, renderer aliases or dependency overrides. The native TypeScript `vue` path matches NativeScript-Vue's normal type setup; webpack has only `init` and `resolveConfig`.

All consumers check direct imports, global component template types and a single resolved Vue runtime. Web also checks SSR rendering, production compilation and absence of NativeScript/Jolt dependencies. Native checks platform-independent theme imports and Android/iOS webpack bundles. The `native-vite` consumer uses `@nativescript/vite` 8.0.21 with PascalCase templates and asserts that each platform bundle contains the Mavis iOS or Android code and none of the other platform (#58). Full native builds and real interactions are separate steps below. The result JSON records the temporary directory.

After publication, run the same checks with registry versions:

```sh
npm run release:check -- --registry
```

## Runtime checks

From the recorded `native` directory, with SDKs configured, run `ns build android --no-hmr` and `ns build ios --emulator --no-hmr`. Install only on the selected test targets. The fixture uses `com.getcortexlabs.mavis.consumer`, leaving the catalog app separate.

Verify the ten-component screen, edit Name, save through the loading state, adjust Volume, toggle Details and change the theme. Confirm that values update, Reveal releases its space and native press feedback runs without exceptions. Capture both platforms and inspect logs for JS/native errors. Screen and Input behavior beyond this smoke check remain covered by their dedicated protocols.

Serve the recorded Web consumer with Vite and exercise the same controls in Chromium and WebKit. Confirm loaded styles and theme changes. Bundle success alone does not establish native runtime behavior or browser interaction.

With Playwright browsers installed, `node scripts/check-consumer-web.mjs tarballs` performs this Web smoke check and saves screenshots and a report. Pass `registry` after the registry consumer checks. CI runs the tarball check in both browsers.

## Release procedure

1. Update the three package versions and exact core dependency, changelog and installation examples. Keep the npm tag `alpha` while the API is experimental.
2. Run `npm run check`, browser tests, package checks and the native runtime smoke. Inspect the actual tarballs; never publish directly from an unvalidated source folder.
3. Commit the release source. Publish the validated core tarball first, then native and Web, using `npm publish <file.tgz> --access public --tag alpha`. Authentication and npm confirmation remain interactive when required.
4. Verify registry versions, `alpha` tags and integrity against `manifest.json`. Run registry consumers. Do not reuse a published version if bytes need to change.
5. Push the release commit, create and push the annotated `v<version>` tag at that commit, and create a GitHub prerelease with the changelog, tarballs and checksums. Do not mark it as the latest stable release.
6. Verify CI/deploy, update #43/#45 and the tracking index. Report hosting propagation separately from package publication.

## HTML forms and Input handles (#119–#121)

`WebForms.vue` is compiled both by the catalog's `/checks/forms` route and by the clean Web consumer (`#forms`). It exercises actual HTML forms, editor attribute placement, FormData, constraint validation, submitter identity, click/Enter, component submit ownership, IME/newlines, disabled/loading actions, external form association, controlled reset and public focus/blur. Run `test/browser/forms.browser.ts` in Chromium and WebKit for the full matrix. `scripts/check-consumer-web.mjs` repeats the core flow against installed tarballs.

`Types.vue` checks direct `InstanceType` refs, inferred direct/global `useTemplateRef` refs and portable `InputHandle` refs in Web, NativeScript webpack and NativeScript Vite consumers. It also rejects invalid button types, inputmode and required values. Browser form semantics are Web-only; native input handles and keyboard events retain their existing runtime behavior.
