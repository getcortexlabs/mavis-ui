---
title: Morrow
description: Shared sign-in and signup with composed Buttons, retained form drafts and notifications across routes.
---

# Morrow

A place to begin. Sign-in, signup, recovery and a welcome screen use the same Vue source on NativeScript and Web.

<a href="/playground/#/showcase/morrow" target="_blank" rel="noopener">Open Morrow ↗</a>

The forms own their drafts with `MTabs keepAlive`. Button demonstrates a brand mark made from Mavis primitives and a trailing badge. `useToast({ scope: 'app' })` delivers the confirmation on the next Screen. Recovery demonstrates deferring feedback while a Sheet covers the page.

This is a local preview, without authentication, email delivery or password persistence. The APIs are in the repository for the next alpha, not published alpha.3.

## Shared source

<details>
<summary>Auth.vue</summary>

<<< @/../examples/catalog/shared/pages/Auth.vue

</details>

<details>
<summary>AuthForm.vue</summary>

<<< @/../examples/catalog/shared/auth/AuthForm.vue

</details>
