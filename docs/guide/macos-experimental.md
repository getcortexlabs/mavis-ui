---
title: Experimental macOS starter
description: Generate a small native SwiftUI app and a Vue/Vite screen from one Mitosis source.
---

# Experimental macOS starter

RC.12.2 introduces an **opt-in compiler experiment**: a basic screen authored in Mitosis generates Vue on the Web and SwiftUI on macOS. This does not extend the existing 92-component renderer to macOS or convert existing `.vue` screens.

```sh
npx @getcortexlabs/create-mavis@0.1.0-rc.12.2 first-light --target macos --yes
cd first-light
npm install
npm run macos
```

Choose **macOS + Web · experimental** in the wizard, or use `--target macos`. Add `--package-manager pnpm` or `--package-manager yarn` for matching commands and configuration. Native compilation requires **macOS 14+ and Xcode**; Web and generation can also run on other hosts. The template uses Mitosis **0.14.2** only during development/build.

## One editable screen

```text
shared/Welcome.lite.tsx
            │ Mitosis + bounded Mavis adapters
            ├── web/Welcome.generated.vue → Vue + Vite + Mavis Web
            └── native/.../Welcome.generated.swift → SwiftUI / macOS
```

The starter includes a window, typography, theme tokens and a small counter with add/reset actions. The native output uses `@State`, `Text`, stacks and real `Button` controls. There is no WebView or JavaScript runtime in the Mac app. Each host keeps its own local state; this is source sharing, not synchronization between running apps.

Edit `shared/Welcome.lite.tsx`. Run `npm run generate` to update both outputs. Startup/build commands regenerate automatically; while Vite is already running, regenerate after editing the shared source, and Vite reloads the output. Rebuild/reopen macOS for native changes. Do not edit generated files.

| Command               | Result                                                   |
| --------------------- | -------------------------------------------------------- |
| `npm run dev:web`     | Generate and start Vue/Vite                              |
| `npm run build:web`   | Generate and build Web                                   |
| `npm run generate`    | Validate the supported grammar and generate both targets |
| `npm run macos`       | Generate, compile and open the native app                |
| `npm run build:macos` | Compile `dist/first-light.app` without opening it        |

Use `pnpm run` or `yarn run` instead when chosen. The generated README follows that choice. `--doctor` checks the Mac toolchain and source grammar; it does not replace compilation. Web builds go to `dist/web`; native apps go to `dist/first-light.app`.

## Deliberately small contract

| Supported         | Boundary                                                              |
| ----------------- | --------------------------------------------------------------------- |
| `MColumn`, `MRow` | Literal `gap` and `padding` spacing tokens                            |
| `MText`           | One text literal or state reference; `variant` and `tone` tokens      |
| `MButton`         | Literal `text`, `primary`/`secondary`, one `onClick` assignment       |
| `useStore`        | String, boolean and non-negative integer initial values               |
| Actions           | Same-type literal assignment or integer increment                     |
| Themes            | Fixed Mavis or Midnight, using core palette/spacing/typography values |

Unsupported syntax or props stop generation. Arbitrary TypeScript, methods, props, conditional/loop rendering, effects, asynchronous services, navigation, persistence and other Mavis components are not supported. `--add-native`, `--add-web` and the Vue portability auditor are not migrations for this experimental project. `--example directory` and Nuxt are deliberately rejected for this target.

Web buttons retain Mavis/Jolt. Native button feedback uses SwiftUI and respects Reduce Motion; **the generated screens do not use Jolt yet**. Jolt 0.1.0-rc.13 ships a SwiftUI package; adopting it in this starter is tracked in [#315](https://github.com/getcortexlabs/mavis-ui/issues/315). Typography and layout follow each host; exact pixel parity is not promised. The `.app` is for local development: signing, notarization, installers and App Store distribution are not configured.

The longer-term portable model remains tracked in [#144](https://github.com/getcortexlabs/mavis-ui/issues/144), [compiler evaluation](https://github.com/getcortexlabs/mavis-ui/issues/146) and [direct native integrations](https://github.com/getcortexlabs/mavis-ui/issues/42). This starter is a small executable first step, not completion of those initiatives.
