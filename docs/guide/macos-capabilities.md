# Mac component support

The experimental compiler reads shared Vue SFCs or Mitosis TSX and generates SwiftUI. This inventory describes the source on this branch; it does not claim that these additions are present in the latest npm package or that every interaction has passed runtime validation.

**Partial** means a component has a renderer for the listed source contract, with expression, property or platform limits. **Unsupported** means there is no registered Mac renderer. Accepted property names alone do not establish complete contract support.

The same data is available as `macosCapabilities` and in the `macos-swiftui` entry of `targetCapabilities.targets`, from `@getcortexlabs/mavis-core`. The CLI exposes it with:

```sh
npx @getcortexlabs/create-mavis --capabilities --json
npx @getcortexlabs/create-mavis --check-portability
```

The inventory comes from the compiler registry, Vue property/event mappings and reviewed limitations. A consistency test keeps core, CLI and documentation aligned. New findings belong to the linked family issue; [shared motion API limits](./macos-experimental) are also reported by `targetCapabilities.developmentMotion.macos`.

<MacCapabilityMatrix />
