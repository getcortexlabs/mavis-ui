# Mac component support

**Experimental RC.14:** parity issues [#338–#354](https://github.com/getcortexlabs/mavis-ui/issues/338) remain open. This matrix describes the shipped subset; registration and compilation do not establish complete parity.

The experimental compiler reads shared Vue SFCs or Mitosis TSX and generates SwiftUI. This inventory describes the RC.14 source contract and its known limits; it does not certify every interaction or full renderer parity.

**Partial** means a component has a renderer for the listed source contract, with expression, property or platform limits. **Unsupported** means there is no registered Mac renderer. Accepted property names alone do not establish complete contract support.

The same data is available as `macosCapabilities` and in the `macos-swiftui` entry of `targetCapabilities.targets`, from `@getcortexlabs/mavis-core`. The CLI exposes it with:

```sh
npx @getcortexlabs/create-mavis --capabilities --json
npx @getcortexlabs/create-mavis --check-portability
```

The inventory comes from the compiler registry, Vue property/event mappings and reviewed limitations. A consistency test keeps core, CLI and documentation aligned. New findings belong to the linked family issue; [shared motion API limits](./macos-experimental) are also reported by `targetCapabilities.developmentMotion.macos`.

<MacCapabilityMatrix />
