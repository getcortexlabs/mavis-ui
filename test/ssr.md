# Vue SSR conformance

Issues #157/#158/#195/#196. Run from the repository with Node 22.23.3:

```sh
npm ci
npm run check
npm run release:pack
node scripts/check-core-consumer.mjs
node scripts/check-nuxt-consumer.mjs
npx playwright install chromium webkit
node scripts/check-nuxt-browser.mjs
node scripts/check-nuxt-static.mjs
```

The Nuxt consumer pins Nuxt 4.6.3 and Vue 3.5.44 with Jolt RC.6. It installs the packed core/Web packages in an isolated temporary directory, runs Nuxt's own typechecker, then builds production `node-server` output. It has no aliases to repository source or NativeScript renderer dependency. Generated paths/reports are in `artifacts/ssr`; retain those artifacts on failures. The static check runs `nuxt generate` and serves only `.output/public`, with no Nitro server or API running. Diagnostic request routes are excluded from prerendering.

## Assertions another adapter must preserve

| Boundary                  | Evidence                                                                                                                                                                                                                                                                                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework-free core       | Clean root import and strict TypeScript with ES libraries only; no Vue, DOM, NativeScript or Jolt installation.                                                                                                                                                                                                                                      |
| Contract consistency      | Neutral descriptors match Vue props; current Web/native behavior suite checks controlled values, disabled activation, content constraints and focus handles. Catalog/default/reference/capability drift tests cover both languages.                                                                                                                  |
| Request-owned state       | Eight concurrent Nuxt requests with different profiles and cookie themes; unit tests overlap async renders and verify separate app ID prefixes/scopes. Failed HTTP rendering and an abandoned request cannot change the next response.                                                                                                               |
| Useful server content     | Initial headings, values and selected content are present without JS. All registered components participate across notebook/component pages, including deferred overlays and Toast.                                                                                                                                                                  |
| No effects on the server  | Fake-clock SSR checks keep Jolt surfaces unavailable and schedule no Toast/animation timers; open Sheet/Dialog props do not activate a browser modal. No native modules in the Nuxt lock/client assets.                                                                                                                                              |
| Data transfer             | `useAsyncData` transfers the profile; hydration performs zero duplicate profile requests. Runtime private configuration is absent from public output.                                                                                                                                                                                                |
| Forms and identity        | Delay client chunks, edit existing text/textarea/checkbox/radio/range controls, retain node identity, IDs and selection, then adopt the edits once. Test nullable numeric choices, parent rejection, parent updates, disabled/read-only fields and unchanged values.                                                                                 |
| Composition and submit    | Composition/input events preserve Japanese text; composing Enter does not submit and a subsequent normal Enter submits once. Ordinary form submission has one handler. This is event-level coverage, not physical IME validation.                                                                                                                    |
| Interactions and overlays | Nullable Select, Tabs, Accordion, controlled Sheet/Dialog, initially open Sheet focus, motion press and Reveal remain functional after hydration without warnings.                                                                                                                                                                                   |
| Motion lifecycle          | Hold press, change reduced motion, release, navigate away/back. Old surface/scroll source becomes unavailable, owned motion value/link is disposed, cleanup runs once and the remount installs once. App Toast survives the route change by design. Existing browser motion suites cover observers/interruption and repeated disposal in more depth. |
| Appearance                | Cookie snapshot equals the initial server/client theme; system preference starts after Nuxt readiness. Static output hydrates from the build snapshot even when the visitor has a dark cookie, then applies the preference.                                                                                                                          |
| Static deployment         | `/static/` has useful generated HTML, edits, submit and overlay interactions on a file server in Chromium/WebKit, with no API calls.                                                                                                                                                                                                                 |

The notebook resets its local draft on route remount. The host must retain drafts if desired. The pending request fixture has a finite timer owned by its service; disconnecting a browser does not imply that Mavis cancels arbitrary host work. Do not rely on client unmount hooks to dispose server resources. No host-created timer, subscription or credential should be stored in a process-wide component singleton.

## Scope and promotion

Source capabilities are exported from `packages/core/src/capabilities.ts`. The six neutral foundation contracts are in `contracts.ts`; Vue coercion/validators remain in `core/vue`. A descriptor is metadata, not an SDUI schema or a portable compiler. Do not mark React/Next or other targets supported from Vue evidence.

To promote a target, add a packed consumer, record framework/runtime versions, run the assertions above against that host, update both language guides and the capability manifest, and link CI evidence in the issue/PR. Do not infer hydration from an import smoke check, streaming from SSR, RSC from React, or native behavior from a DOM renderer.

The current result is experimental and included in alpha.5. Edge presets, streaming, selective hydration/server islands, physical IMEs and physical-device performance remain unverified. Fonts/images need host-owned assets and explicit sizing where required; passing hydration checks does not promise zero layout shift with arbitrary remote assets. No full NativeScript device run is claimed by this Vue SSR batch; existing native contract/types and packed Webpack/Vite bundles provide regression coverage for the shared prop extraction.
