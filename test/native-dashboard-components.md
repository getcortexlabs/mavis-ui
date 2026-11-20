# Dashboard and decorative components

Build the catalog with `ns build android --no-hmr --env.dashboardCheck` and `ns build ios --emulator --no-hmr --env.dashboardCheck`. Install and run with `node scripts/check-native-dashboard.mjs android|ios DEVICE [en|pt]`.

The shared check route is `/checks/dashboard`. It exercises Kanban dragging through Jolt drop zones (the card follows its grip, a cancelled touch and a release outside every column return it, a release over another column moves it, a column at capacity refuses it), each card keeping its own height in a column, controlled Kanban reorder/transfer while filtering, donut selection/data updates, sparkline missing readings, gradient content retention, opt-in particles and explicit/disabled confetti. It also checks finite native view geometry. Reports are written to `artifacts/dashboard/{android,ios}/{en,pt}/report.json` before optional device logs.

These checks call actual native controls/handlers in a simulator/emulator. Kanban drags are driven through the touch and pan observers Jolt attaches to the grip, with positions read from the native views; the system does not deliver the touches. They do not substitute for physical multi-touch, VoiceOver/TalkBack or OS gesture arbitration testing. Kanban drag is scoped to visible targets; menus can transfer to distant columns. Decorative particles have no semantic role and must not carry success information.

Web coverage: `test/browser/dashboard.browser.ts`, `kanban-drop.browser.ts` and `dashboard-docs.browser.ts`. Nuxt SSR/SSG: `scripts/check-nuxt-dashboard.mjs`. Core/SSR contracts: `test/dashboard.spec.ts` and `test/kanban-drop.spec.ts`.

The native compatibility workflow installs the packed Mavis packages and runs both languages, retaining `kanban.mp4`, reports and environment metadata. The iOS run uses an iPad simulator and Android a wide emulator viewport so all columns are visible. The English run also checks the other dashboard components; the Portuguese run checks Kanban. Browser review recordings cover accepted, refused and cancelled moves in both languages on Chromium, WebKit and Firefox.
