# Direct NativeScript adapters

One six-component catalog implemented with plain JS/TS, React NativeScript, Angular, Svelte Native and Solid Native. The entrypoints are unreleased; see the [English guide](../../docs/guide/native-adapters.md) or [guia em português](../../docs/pt-BR/guide/native-adapters.md) for versions, peer overrides, ownership and coverage.

From the repository root:

```sh
npm ci
npm run build
cd examples/native-adapters
npm ci
ns run ios --env.framework=react
ns run android --env.framework=solid
```

The default framework is `plain`. Other choices are `react`, `angular`, `svelte` and `solid`. The NativeScript SDK uses `../catalog/App_Resources`. The app imports no Vue renderer.

`--env.adapterCheck` runs the automatic state, control, theme and Jolt lifecycle probe and writes `adapter-check.json` in the app documents directory. `scripts/check-native-adapters.mjs` builds, installs and runs that probe in CI. The CI installs the two Mavis packages from tarballs before building, and stores reports and recordings under `artifacts/native-adapters`.

The five framework files are separate implementations using normal framework state. `_model.ts` contains only fixture data, independent theme scopes, the neutral motion reference and the acceptance bridge. It is not a runtime or shared state engine shipped to library consumers.
