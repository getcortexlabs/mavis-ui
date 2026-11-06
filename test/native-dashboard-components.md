# Dashboard and decorative components

Build the catalog with `ns build android --no-hmr --env.dashboardCheck` and `ns build ios --emulator --no-hmr --env.dashboardCheck`. Install and run with `node scripts/check-native-dashboard.mjs android|ios DEVICE`.

The shared check route is `/checks/dashboard`. It exercises controlled Kanban reorder/transfer while filtering, donut selection/data updates, sparkline missing readings, gradient content retention, opt-in particles and explicit/disabled confetti. It also checks finite native view geometry. Reports are written to `artifacts/dashboard/{android,ios}/report.json` before optional device logs.

These checks call actual native controls/handlers in a simulator/emulator. They do not substitute for physical multi-touch, VoiceOver/TalkBack or OS gesture arbitration testing. Kanban drag is scoped to visible targets; menus can transfer to distant columns. Decorative particles have no semantic role and must not carry success information.

Web coverage: `test/browser/dashboard.browser.ts` and `dashboard-docs.browser.ts`. Nuxt SSR/SSG: `scripts/check-nuxt-dashboard.mjs`. Core/SSR contracts: `test/dashboard.spec.ts`.
