# Shared authentication composition

Covers #125, #128 and #129 with the same Vue pages in NativeScript and Web. Morrow is a local interaction preview: it neither authenticates nor sends email.

## Run

Build the catalog with `ns build ios --emulator --env.inputCheck=auth` or `ns build android --env.inputCheck=auth`. Normal builds start at the catalog; choose Showcase → Morrow. Web uses `/playground/#/showcase/morrow`.

1. Enter different emails in Sign in and Create account. Switch repeatedly, including with the keyboard open. Each child form retains its own draft; the inactive form leaves the visible/accessibility tree.
2. Open recovery, preview it and close the Sheet. Feedback appears after the modal releases the screen. It does not steal focus or consume its visible duration under the modal.
3. Activate Continue with Studio from its mark, text and badge. It is one button named Continue with Studio; decorations are not separate actions. The welcome notice survives the navigation to Home.
4. Trigger another notice, background the app and resume before its remaining duration expires. Return to Sign in. Retained native pages must reacquire the queue without another page's callbacks dismissing it.
5. Repeat in Mavis/Midnight and larger system text. Text wraps; content can flow onto another line. Use compact decorations, especially for very large system text. Confirm Android Tab/Space activation and focus styling. No iOS hardware-keyboard audit is claimed.
6. Build normally without the check flag before shipping.

## Lifecycle coverage

`test/browser/auth.browser.ts` exercises child drafts, route replacement, modal/non-modal and nested dialogs, timer suspension, keyboard activation, large button text, and cached panels containing Sheet/Dialog/Toast/Reveal. `/checks/tabs` has an opt-in Retain panels control for reproducing cached content. External selection in the browser fixture exercises deactivation while a modal owns input.

Contract tests cover both renderers: typed key identity, reordering, removing cached panels, activation/deactivation, lazy mounting and the existing default unmount policy. Queue tests exercise overlapping host ownership, stale callbacks, remaining duration and disposal. Application queue instances are isolated; caller unmount does not dispose the app queue. Android keyboard tests cover repeats, disabled changes, cancellation, focus loss and cleanup.

The cache uses the platform's Vue KeepAlive implementation instead of mounted hidden panels. NativeScript detaches/unloads native views; Web removes the cached DOM from focus and reading order. Library retains the existing example of parent-owned state without caching. Application timers and observers still need `onDeactivated` cleanup; Vue caching does not pause arbitrary effects.

## Device review

Reviewed on an Android API 36 emulator and an iPhone 17 Pro simulator running iOS 26.2: separate form drafts, recovery → feedback, login → home feedback, background/resume and native back. Android keyboard activation was exercised with Tab and Space. Large-text review used Android font scale 2 and iOS's largest accessibility category. Web covers Chromium/WebKit, both themes and 320/390/1440px.

These are emulator/simulator checks, not physical-device or comprehensive screen-reader certification. Existing device coverage work remains separate. Evidence is kept locally under `artifacts/auth`; normal builds contain no authentication probe.
