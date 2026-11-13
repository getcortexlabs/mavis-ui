---
title: Nuxt, SSR and static generation
description: Render Mavis Vue components on the server, hydrate without losing edits, and generate a static route with Nuxt.
---

# Nuxt, SSR and static generation

Mavis screens can receive their initial data from Nuxt and render useful HTML before JavaScript loads. Keep Nuxt fetching and routing in the host page; share the child component's props, state and Mavis template with a NativeScript host.

::: info Experimental integration in RC.12
This guide describes the repository's tested Nuxt consumer. The hydration fixes are included in Mavis `0.1.0-rc.12.1`. Install core and Web at the same version. Do not disable SSR or wrap the whole screen in `ClientOnly`.
:::

Source validation baseline: **Nuxt 4.6.3, Vue 3.5.44, Node 22.23.3 and Jolt 0.1.0-rc.15**. The fixture lives in `test/consumers/nuxt` and installs tarballs outside the workspace, without aliases to source files. It uses production `node-server` output; other Nitro presets and streaming/partial hydration remain unverified.

## Install and register

Install `@getcortexlabs/mavis-core@0.1.0-rc.13`, `@getcortexlabs/mavis-web@0.1.0-rc.13` and `@rafaelaugusto/jolt@0.1.0-rc.13` together. To test a local checkout, use `npm ci && npm run release:pack` and install the core/Web tarballs from `artifacts/release/packages` instead. Do not install the NativeScript renderer into the Nuxt app.

Load the Web stylesheet in `nuxt.config.ts`; it includes the bundled icon font. Custom fonts belong to the host: define/preload their assets and configure matching theme family names on server and client.

```ts
export default defineNuxtConfig({
  css: ['@getcortexlabs/mavis-web/style.css'],
})
```

Create `app/plugins/mavis.ts`. The plugin runs for each Nuxt application/request, so themes and app Toast queues are not process-wide singletons.

<<< @/../test/consumers/nuxt/app/plugins/mavis.ts

The `useState` snapshot makes the first server and client render agree. A request can use an explicit light/dark cookie. A static page starts from its build-time snapshot, since a build cannot know a visitor's cookie. `onNuxtReady` then applies that visitor's cookie or starts system appearance observation after hydration. A device-selected theme can change the page color at this point; use a server-known preference when avoiding that change matters. Keep scoped themes deterministic too.

The default client-only `createMavis()` setup remains useful for SPAs. In SSR, do not select a browser-only theme during the client's first render or copy this setup into a `.client.ts` plugin: the server needs the same provider.

## Supply data from the host

Use Nuxt's payload-aware data API in a page and pass ordinary values to the shared component:

<<< @/../test/consumers/nuxt/app/pages/index.vue

`PreferenceEditor` receives a serializable profile. Its local state starts from those props; the host owns authentication, cache policy, mutations, retries and cancellation. Do not serialize callbacks, motion handles, secrets or platform objects. Keep server-only imports in Nuxt server code. The consumer verifies that hydration does not repeat the initial API call and private configuration is absent from client assets.

The fixture remounts the editor on navigation back, resetting local drafts from the host's initial profile. Persist a draft in app-owned state if your product needs it to survive navigation. An app-scoped Toast intentionally survives route changes; its queue belongs to that application.

## Hydration behavior

- Input, multiline Input, Checkbox, Radio and Slider preserve edits made to their existing HTML controls before hydration when the initial parent value still matches the server snapshot. They emit one controlled update when mounted. If the parent rejects it, its value wins. Disabled/read-only inputs do not adopt edits.
- Text selection and the editor node remain intact. Input's composing Enter does not submit. Automated composition-event checks are not a physical IME audit.
- Generated IDs use Vue `useId`; keep the initial tree, option order and initial props consistent. With multiple Vue applications in one document, assign distinct, matching server/client `app.config.idPrefix` values. A request is a new app, not a shared counter.
- Ordinary HTML controls can receive input before JS. Button-based Switch, Select, Tabs and Accordion require hydration for their actions. Mavis does not queue/replay pre-hydration clicks or network submissions.
- Input's parent still owns reset semantics. Use `@reset.prevent` to reset models rather than relying on the browser's default-value snapshot. See [Input](../components/input#html-forms-web).

## What renders on the server

All registered components participate in the Vue conformance fixture, with these presentation boundaries:

| Component family | Server and client ownership |
| --- | --- |
| Layout, text/Span, icons, cards, identities, feedback, list rows | Useful initial HTML; image loading and font resolution remain browser/host work. |
| Inputs and choices | Initial values and associations in HTML; editing adoption and interactive actions activate on the client. |
| Tabs / Accordion | Deterministic selected/expanded content from props. Panel retention follows their ordinary component contract. |
| Sheet / Dialog / Select popup | Modal presentation, focus trapping, scroll locking and positioning start on the client. An initial `open` does not open a browser modal during SSR. Put SEO-critical content outside a deferred overlay. |
| Toast | No server presentation or duration timers. Queue ownership is per app/component; notifications are browser feedback. |
| Reveal / press / experimental motion and scroll surfaces | Initial content/state renders without Jolt playback or measurement. Surfaces become available after mount, respect reduced motion and release resources on unmount. |

Do not acquire timers, browser listeners or service subscriptions in server `setup()`. Server rendering does not call a client unmount hook as a request finalizer. The host owns abort signals and disposal for async services. The test fixture exercises failed and disconnected requests for isolation; its finite delayed service is not a claim that Mavis cancels host work.


Sheet drag currently requires an untransformed, unzoomed ancestor chain. This also affects Select, whose popup uses Sheet: keep it outside a card with an active motion surface. The top-layer composition failure is tracked in [#197](https://github.com/getcortexlabs/mavis-ui/issues/197).

## Static and hybrid routes

The consumer prerenders `/static` with constant profile data and hydrates it from a plain file server. It needs no live API. A Nuxt server build can serve that route alongside request-rendered pages using:

```ts
routeRules: { '/static': { prerender: true } }
```

Full `nuxt generate` is also exercised for this route, excluding dynamic diagnostic routes. A static deployment cannot serve the fixture's `/api/profile`; provide build-time data, a real external service or a compatible server deployment for dynamic pages. Prerender only public data: build output and its payload are shared files, not a personalized request cache.

## Repeat the validation

From the repository, using the Node version above:

```sh
npm run release:pack
node scripts/check-core-consumer.mjs
node scripts/check-nuxt-consumer.mjs
npx playwright install chromium webkit
node scripts/check-nuxt-browser.mjs
node scripts/check-nuxt-static.mjs
```

Results, logs and screenshots go to `artifacts/ssr`. [The conformance protocol](https://github.com/getcortexlabs/mavis-ui/blob/main/test/ssr.md) lists the scenarios and limits. React/Next, portable compilation and SDUI remain separate roadmap work; [architecture and support](./architecture) explains the boundaries.
