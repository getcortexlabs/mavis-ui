---
title: Compositions
description: Shared forms and application patterns built from Mavis components, ready to study and adapt for Vue Web and NativeScript.
---

# Compositions

Start with a complete interaction instead of assembling every field yourself. Compositions combine Mavis components, application state and event handlers in shared Vue files. The same examples run in Vue Web and NativeScript; Nuxt uses the Web renderer.

| Composition | Includes | Example and source |
| --- | --- | --- |
| Auth form | Sign-in, signup, recovery, retained drafts and feedback | [Morrow](../showcase/morrow#shared-source) |
| Step form | Registration, validation, dates, search and attachments | [Gather](../showcase/gather) |
| Search and filters | Search, topic filters, saved items and empty states | [Library](../showcase/library#source) |
| Profile editor | Live preview, validation, preferences, save and discard | [Profile](../showcase/profile#source) |
| Team directory | Filtered people, details in a Sheet and favorites | [Team](../showcase/team#source) |

Open the example, inspect its shared source and adapt the state and handlers to your application. These are compositions of existing components, not additional package exports. Authentication, uploads and persistence in the examples are local demonstrations; connect your own services when adopting them.

[Components](../components/) provides the individual building blocks. [Showcase](../showcase/) presents complete screens and visual identities. [Sharing screens](../guide/sharing) covers the platform entries, navigation and services around the same Vue screen.
