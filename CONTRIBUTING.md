# Contributing to Mavis UI

Mavis UI is a component and theme library for NativeScript and the Web, starting with Vue. It is experimental: the API can change between prereleases.

## Start from an issue

Every change belongs to an issue. Look at the [tracking index](https://github.com/getcortexlabs/mavis-ui/issues/1) first; if the work is not there, open an issue with the bug or component form and link it to the index.

An issue states its scope and a checklist of completion criteria. A pull request says `Closes #n` when it meets all of them and `Refs #n` when it delivers a part, and says in its own words what is still open.

Bugs in the motion engine go to [Jolt's repository](https://github.com/rafaelaugustos/jolt/issues) once they are reproduced with Jolt alone.

## Working locally

Node 22 or later.

```sh
npm ci
npm run build        # core, NativeScript and Web packages
npm run check        # formatting, docs build, types, unit and SSR tests
npm run test:web     # Playwright: Chromium and WebKit, Firefox for the motion specs
npm run web:dev      # the catalog as a Vue Web app
npm run docs:dev     # the documentation site
```

Packages type-check against each other's built output, so run `npm run build` after changing `packages/core` and after switching branches.

Packed packages in clean consumers:

```sh
npm run release:pack
npm run release:check                  # Vue Web, NativeScript webpack and NativeScript Vite
node scripts/check-nuxt-consumer.mjs   # then check-nuxt-browser.mjs and check-nuxt-static.mjs
```

The native catalog is in `examples/catalog`. `test/native-*.md` describes each native check and how to run it on a simulator or an emulator; `test/ci.md` describes what CI runs for which files. A file with no rule in `scripts/ci-plan.mjs` fails the planner's test, so add one when you add a new kind of file.

## The shared boundary

- `packages/core` has no DOM, NativeScript or Jolt. Props, events and types are declared once there (`src/contracts.ts`, `src/vue/props.ts`) and both renderers derive from them.
- `packages/nativescript` and `packages/web` render the same contract. A difference between them is either a bug or a documented platform limit.
- Application code never receives a DOM element or a native view. Motion goes through declared surfaces and regions; Jolt owns timing and frames.
- Demos live in `examples/catalog/shared` and run unchanged in the native app, the Web app and the documentation previews. A value that only one renderer understands, such as a CSS keyword in a `style`, does not belong in a shared file.

## Visual direction

Two themes, Mavis (light) and Midnight (dark), in rose and blue. Green is only the semantic colour for success. Components take their colours, type, spacing and shape from the theme.

The documentation keeps the default VitePress theme with the project's identity. A component pull request does not redesign the site.

## Evidence

Say what you ran and where, and what you did not run.

- Unit and SSR tests, and browser tests in the engines the change touches.
- Packed consumers when exports, types or styles change.
- Simulator, emulator or physical device, named as such. A simulator run is not a device run.
- Recordings at real speed, labelled with the platform. If a probe activates the controls, say so.
- No performance claim without a measurement and its conditions.
- Limits stated plainly: what is not covered, and what differs between platforms.

Do not weaken an assertion or add a sleep to make a test pass. If a test is unstable, find out why.

## Delivered is not released

Merging delivers work to the repository. It is released only when a version containing it is published to npm.

- Until then, guides say the feature is in the repository for the next release.
- Add a line to `CHANGELOG.md` under "Unreleased".
- A release is its own pull request: versions, the creator's pins and presets, notes and documentation.

## Documentation and catalog

A component is documented in both languages and shown with its real example.

- Reference pages: `docs/components/<name>.md` and `docs/pt-BR/components/<name>.md`. Guides follow the same pairing under `docs/guide` and `docs/pt-BR/guide`.
- Catalog entry, demo and reference: `examples/catalog/shared/catalog.ts`, `shared/demos` and `shared/reference.ts`.
- Catalog text in both languages: `examples/catalog/shared/locale/messages.ts`.
- Site navigation and gallery: `docs/.vitepress/catalog.mjs` and `docs/.vitepress/navigation.mjs`.

When the work is done, tick the issue's criteria with the evidence, and update the tracking index.

## Pull requests

Title and description in English. Describe the problem, the change and how it was checked, in your own words. Keep one concern per pull request, or a small group of related issues.
