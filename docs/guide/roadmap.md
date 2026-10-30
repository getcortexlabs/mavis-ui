---
description: "Follow the Mavis UI roadmap: NativeScript-Vue first, more NativeScript frameworks next, and possible future React Native, Flutter, and native integrations."
---

# Roadmap

Mavis is in early development. The first alpha is available for testing, with no stable release date.

## Now: validating the foundation

The repository includes layouts, text, cards, buttons, text inputs, sliders, a reveal transition, two themes, and the native component catalog. The same catalog screens and state also run on Vue Web. Native uses Jolt and vue-router-ns; Web uses CSS motion and Vue Router. [See how sharing works](./web). [Try the foundation](./foundation).

## First release direction: NativeScript-Vue

The first implementation targets NativeScript-Vue on iOS and Android.

Before a package release, we need broader device and accessibility testing, layout edge-case coverage, and feedback on the API. Sheets and a larger component collection will follow this foundation.

## Next: the other NativeScript frameworks

Vue is the first entry point, not the limit of the library. We plan to extend support to the other frameworks in the NativeScript ecosystem.

The aim is to preserve component names, properties, and composition rules, with syntax appropriate to each framework. Theme definitions already live outside the Vue integration.

## Later: explore other platforms

React Native, Flutter, and direct native integrations are possible future directions. None is currently in development as part of Mavis, and there is no committed release order.

| Platform | Direction |
| --- | --- |
| NativeScript-Vue | Experimental implementation in the repository |
| Vue Web | Experimental implementation with shared screens |
| Other NativeScript frameworks | Planned expansion |
| React Native | Future possibility |
| Flutter | Future possibility |
| Direct native integrations | Future possibility |

## Follow progress

The [GitHub repository](https://github.com/getcortexlabs/mavis-ui) is the place to follow the implementation. Installation instructions and versioned API docs will arrive with the first usable package.
