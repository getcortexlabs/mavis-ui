# Changelog

## Unreleased

- Read the effective reduced-motion preference of the region's Jolt runtime in the Web owners that watched the system setting themselves: `MChart`, the animated divider of `MResizablePanels` and `MImageCompare`, `MMarquee` and the dashboard backgrounds. `configureMavisWebMotion(region, { reducedMotion })` in `@getcortexlabs/mavis-web/experimental` gives a region its own policy (`user`, `always` or `never`); two regions stay independent and a change settles an update in flight.
- Let the creator combine Web, Native (iOS and Android through NativeScript) and Mac in any combination: `--targets web,native,macos` and a multi-select in the wizard. `--target mobile|web|both|macos` keeps working. Projects record `targets` in `mavis.config.json` schema 2; doctor and the audit still read schema 1.
- With Mac, shared screens are TSX in `shared/` and the compiler writes each selected target: `apps/web` (Vue + Vite), `apps/mobile` (NativeScript-Vue) and `apps/macos` (SwiftUI). Root scripts generate first and then run the host (`dev:web`, `ios`, `android`, `macos`, `build`). npm, pnpm and Yarn work for every combination.
- Generate NativeScript Vue from the same sources: no DOM attributes or hardware-key handlers, the same Mavis components, and rows that keep focus and the text selection when the list reorders. The conformance corpus now also runs on an iOS simulator and an Android emulator.
- Run motion through Jolt on the Mac with JoltSwiftUI (`jolt-swift` 0.1.0-rc.13, a small standalone package): buttons press with `joltMotion`, `<Show animate>` uses `JoltPresence` and `<For animate>` uses `joltLayout`. Web and Native use the Mavis reveal and keyed layout regions. Reduce Motion is respected everywhere. The Mac build copies Jolt's resources into the app.
- Grow the experimental macOS starter's compiler beyond one screen: shared components in `shared/*.lite.tsx` with typed properties and callbacks, record types in `shared/*.ts`, `useStore` state (strings, numbers, booleans, unions, records, arrays), getters, actions with parameters and statements, `Show`/`else` and keyed `For`. Sources are type-checked with TypeScript and rejected with `file:line:column` outside the supported subset.
- Generate Vue and SwiftUI with a Mavis-owned emitter instead of Mitosis's generators, which produced invalid Swift and renamed Vue code on name collisions for these constructs. Mitosis's component format stays; the package is no longer installed. SwiftUI output keeps JavaScript number semantics and text, UTF-16 `length`, and JavaScript `trim`, `splice`, `slice` and `Math.round`.
- Check six fixtures in `test/portable` step by step in the generated Vue (Chromium, WebKit) and the generated SwiftUI app (XCUITest on macOS).
- Add forms to the macOS starter's compiler: `MInput`, `MCheckbox` (with `indeterminate`) and `MSelect` with a value and a change handler, field messages, `onSubmit` on Return and `onEscape`, and `useRef<MavisFieldRef>` so actions can focus or blur a field. macOS uses `TextField`, `SecureField`, `TextEditor`, a checkbox `Toggle` and a menu `Picker`.
- Add list editing to the same compiler: `toSorted`, `list[index]`, string comparisons, narrowing in ternaries, record spreads without an explicit type, handlers that ignore trailing arguments, and arrow keys on a labeled stack. Rows keep focus and the text selection when the list reorders, on the Web too, where the generated list moves the focused row with `moveBefore` or restores focus.
- Check a task form and a filterable task list as two more conformance sessions, with typing, keys, focus and field values compared on all three targets.
- Follow the pointer on NativeScript through Jolt's native hover input, replacing the static fallback, and expose `presence` (1 while a hovering pointer is inside the region) and `available` on `pointerFollow` in both renderers. Touch is not hover; an iPhone, or a device with no mouse, keeps the resting values without a platform branch in the recipe. Afterglow leans its card from `presence` with the same shared recipe on the Web, iOS and Android.
- Resolve the creator's choices from one versioned catalog: targets, frameworks, authoring, Web hosts and rendering, examples, pins and the tools a project needs. `--capabilities` prints it (`--json` for tools) with how each combination has been validated: published, published as an experiment, or only in the repository. The wizard, the flags, doctor and the CI matrix read the same catalog, and frameworks and hosts that are not built yet come from `targetCapabilities` in core with their tracking issues.
- Reject choices that cannot be created with the reason, the tracking issue for planned ones and the available alternatives, before any file is written and without changing a choice. `--familiar` records what a developer already knows as advice only.
- Record each app's toolkit, framework, host and rendering in `mavis.config.json` (`apps`), with `mode` and `execution` next to `authoring`. Configurations from earlier creators are migrated when read; doctor reports the project's configuration and its status.
- Add `create-mavis --example tasks` for any combination with Mac: a small task manager written once in `shared/` (list beside its detail, a form with validation, filters with counts, live edits, reorder, delete, empty states, keyboard shortcuts and motion through Jolt) and generated for the Web, iOS and Android through NativeScript, and the Mac. The wizard offers it when Mac is selected. `portability.entry` in `mavis.config.json` names the screen every app opens.
- Add `MGrid`, `MCard` and button shortcuts to the shared-source compiler. `MGrid` fits as many equal columns as `minColumnWidth` allows, up to `columns`, and reads cell by cell for assistive technology; `MCard` is the theme's card and, with `onClick` and a `label`, one button that presses through Jolt; `shortcut="mod+k"` on an `MButton` is Command on the Mac and Control or Command on the Web. An animated `Show` can sit in a card.
- Replay the Tasks example's own sources as one more conformance session on the Web, the Mac, an iOS simulator and an Android emulator, comparing the rows' accessible names with texts, fields and focus. The macOS harness now scrolls controls into view, and CI keeps its recordings.
- Fix generated Mac text fields not taking focus from a click on their middle line: the decorative border was hit-testable, which showed on two-row multiline fields.
- Fix generated Vue failing `vue-tsc` when an expression used `&&` or quotes inside a template attribute, or when an `MSelect` handler took the choice. Expressions carry no HTML entities, and choices reach handlers as strings.
- Fix a multiline Web `MInput` in a container whose width changes with its layout, such as a grid going from two columns to one, logging `ResizeObserver loop completed with undelivered notifications` in Safari when its text wrapped again.
- Fix a labelled `MCard` that only shows something not being read as one element: with an `accessibilityLabel` and no action, the card is now one accessible element on NativeScript (its content hidden from assistive technology) and `role="img"` on the Web. An explicit `accessible` attribute or `role` still decides.
- Fix Web components that animate their message, such as `MInput` and `MPinInput`, logging `Targets must be mounted HTML elements` when the message disappeared while its text changed, for example an error that clears as you type.
- Upgrade Jolt to **0.1.0-rc.13** across renderer peers (`^0.1.0-rc.13`), development consumers, capabilities and CLI templates. Rebuild native applications after upgrading. The experimental sensor snapshot `backend` can now report `replay` while Jolt plays synthetic samples; it never means hardware is available.
- Fix Web Combobox, Popover, Tooltip, Dialog and Toast leaving their closing element in the page when the component unmounted during its exit animation, for example a combobox popup inside a Sheet that closes right after it.

## 0.1.0-rc.12.2 — 2026-11-08

Coordinate the four Mavis packages at `0.1.0-rc.12.2`; retain Jolt **0.1.0-rc.12.1**. This remains a prerelease.

- Add opt-in `create-mavis --target macos`: a basic `Welcome.lite.tsx` source generates Vue/Vite and native SwiftUI through pinned Mitosis **0.14.2**. Build and open a local macOS app with the generated `macos` script.
- Bound the experiment to MColumn, MRow, MText and MButton, selected theme tokens, literal local state and simple assignment/increment actions. Reject unsupported source instead of silently omitting behavior. Existing Vue screens are not automatically converted; this is not a complete SwiftUI Mavis renderer.
- Include npm/pnpm/Yarn instructions, explicit wizard/doctor support, EN/PT documentation and packed-creator checks. Mitosis is a development dependency of this opt-in starter only. Existing Vue/Vite, Nuxt and NativeScript templates retain their behavior.
- Native button feedback uses SwiftUI with Reduce Motion. Jolt remains the Web motion engine; no Jolt macOS adapter is claimed. Signing, distribution, navigation, asynchronous services and the other Mavis components remain outside this first experiment.

## 0.1.0-rc.12.1 — 2026-11-07

All four Mavis packages use `0.1.0-rc.12.1`, with **Jolt 0.1.0-rc.12.1** pinned in consumers and CLI presets. Keep core, renderers and creator aligned. Rebuild native applications after upgrading. This remains a prerelease; npm `rc` and `latest` target this release and `alpha` remains on alpha.11.

- Upgrade Jolt to **0.1.0-rc.12.1** across renderer peers, locks, development consumers, capabilities and CLI templates. Rebuild native applications after upgrading. This dependency update preserves the existing Mavis API; optional Jolt audio, rigs and other new APIs are not automatically exposed by Mavis.

- Add `MTreeSelect`, `MMasonry`, `MHeatmap`, `MImageCropper`, `MScheduler` and `MNotificationCenter` with shared Vue contracts and Web/NativeScript renderers. Jolt handles layout, color and crop settling where useful, with animation controls and reduced motion.
- Add real PNG/JPEG cropping and export, including native EXIF orientation, temporary-file disposal and stale-source cleanup. Scheduler edits preserve instants and use platform timezone formatters with explicit handling of missing/repeated DST hours.
- Add six bilingual demos, API references and release-specific New badges, plus SSR/SSG, browser accessibility, native interaction and exported-pixel checks. The shared catalog now contains 92 components.

## 0.1.0-rc.12 — 2026-11-06

All four Mavis packages use `0.1.0-rc.12`, with **Jolt 0.1.0-rc.11.1** pinned in development consumers and CLI presets and required by the renderers. Reinstall dependencies and rebuild native apps after upgrading. The optional jolt-native package is not required by Mavis. This remains a prerelease.

- Add **MKanban**, **MDonutChart**, **MSparkline**, **MGradientBackground**, **MParticleField** and **MConfetti** for shared Vue + Vite, Nuxt and NativeScript screens. The catalog reaches **86 components**.
- Keep Kanban moves controlled, preserve filtered cards and enforce column capacity. Add accessible move/reorder alternatives and Jolt drag presentation, settling and layout.
- Draw accessible donut distributions and compact charts through shared Jolt shapes. Provide opt-in animated backgrounds, bounded particle fields and explicit finite celebrations with lifecycle/reduced-motion handling.
- Load catalog demonstrations individually so opening a simple component does not download unrelated showcase photography. Include EN/PT references and release-specific New badges.

- Add **MColorPicker**, **MSwipeDeck**, **MGauge**, **MTour** (with **MTourTarget**), **MTransferList** and **MMarquee** with shared Web/native contracts, optional expressive motion and EN/PT examples.
- Use Jolt for color preview gradients, continuous deck dragging and settling, gauge arc interpolation, anchored tour presentation, transfer layout changes and opt-in marquee playback. Preserve controlled state and canonical accessible values; reduced motion keeps content readable.
- Add custom Popover anchors for retained tour content, restore launch focus without stealing outside-click focus, and follow native ancestor scrolling for those anchors.
- Keep core refresh types usable without DOM dependencies while preserving Web fetch compatibility. Derive documentation gallery category counts from the catalog.

- Add **MCollapsibleHeader**, **MRefreshControl**, **MComposer**, **MSpeedDial**, **MPinInput** and **MAnimatedText** for Vue + Vite, Nuxt and NativeScript, with Jolt-owned motion, controlled state and bilingual interactive documentation.
- Keep scroll/header regions inside an existing screen, cancel stale refresh commits, preserve multiline drafts, restore action focus and retain one real PIN editor. Numeric normalization works without native ICU support.
- Align the CLI portability/import migration inventory with every shared component, including the previously missing collection and interaction components.
- Track responsive geometry for declared Web motion surfaces so resizing an animated image does not interrupt Carousel replacement in WebKit.
- Keep generated Web projects on Vue's matching runtime-core and deduplicate shared Nuxt imports to preserve theme context with Yarn.
- Mark the eighteen new components and updated Popover, Carousel and Image as RC.12 changes; preserve previous release history.
- Upgrade Jolt from RC.11 to RC.11.1 across peers, locks, examples and generated projects. This dependency update does not expose additional Jolt APIs through Mavis.
- Wait for responsive Forma geometry before measuring overflow in browser validation.

## 0.1.0-rc.11.1 — 2026-11-06

Mavis moves from alpha to the **rc** channel. All four Mavis packages use `0.1.0-rc.11.1`; Jolt remains at **0.1.0-rc.11**. This is a prerelease, with the documented platform and accessibility limits still applying. The npm `rc` and `latest` tags target this release; `alpha` stays on alpha.11. Keep core, renderers and the project creator on the same version.

- Add six shared components for Vue + Vite, Nuxt and NativeScript iOS/Android: **MImageViewer**, **MSortableList**, **MSwipeActions**, **MNumberFlow**, **MResizablePanels** and **MImageCompare**. Include controlled state, keyboard alternatives, native handlers, reduced-motion behavior and bilingual examples.
- Use Jolt connected presentation and zoom/pan in ImageViewer, keyed reorder and edge scrolling in SortableList, drag/settling in SwipeActions, rolling digits in NumberFlow, and continuous values for resizing and image comparison. Native numbers use system formatters when Intl is unavailable. SortableList mounts all rows; ImageViewer transitions stay within one page/window.
- Extend Jolt motion across 40 existing components: moving selection indicators, carousel drag/snap, calendar selection, keyed collections, chart geometry interpolation, form feedback and cancelable overlay presentation. Preserve canonical editor values and accessible data while visuals animate; reduced motion settles spatial changes immediately. Static utilities and existing CSS loading effects retain their behavior.
- Fix Tooltip hydration, carousel viewport movement on focus, initial responsive Grid measurement, and indicator alignment after reorder/resize/direction changes. Release observers and motion resources on deactivation or disposal.
- Add **Atlas**, a responsive shared travel-planner showcase with destination discovery, itinerary editing and budget charts. Refresh the default CLI Welcome screen with projects, milestones and draft persistence; Atlas remains a separate catalog example.
- Refresh the VitePress pearl/raspberry presentation while retaining the original Mavis artwork. The catalog now has **68 components**, with six New and 40 Updated badges tied to this release.
- Reuse CI build artifacts, shard browser checks and run focused deployment smoke tests. Preserve the full release matrix; update catalog keyboard checks to follow actual card order.

## 0.1.0-alpha.11 — 2026-11-05

Eleventh experimental release, using **Jolt 0.1.0-rc.11**. Keep core, renderers and the project creator at `0.1.0-alpha.11`. Generated projects pin the same versions. Rebuild native apps after upgrading Jolt.

- Add MDataTable, MCarousel, MRangeSlider, MCalendar, MRating and MTreeView for Vue Web (Vite/Nuxt) and NativeScript iOS/Android, with controlled state, shared contracts, bilingual references and interactive catalog examples.
- Use Jolt for carousel entry, tree expansion, selection feedback and native range-handle feedback. Respect reduced motion and retain explicit keyboard/assistive controls.
- Upgrade Jolt to **0.1.0-rc.11** in renderer peers, development consumers and CLI presets. Rebuild native apps to include the updated helpers. The optional jolt-native package is not required by this batch.
- Standalone calendars do not steal focus, share civil-date arithmetic with date pickers and reject intervals spanning unavailable dates.
- Add MCommandPalette, MNavigationRail, MBreadcrumb, MTooltip and MTimeline with shared contracts, application-owned navigation, keyboard/focus behavior and native alternatives.
- Add MChart for categorical lines and grouped bars: stable category/series keys, signed domains, missing-value gaps, controlled selection/legend visibility and a textual data alternative. Web uses SVG and NativeScript uses native shapes. Initial limits: 100 categories/eight series; zoom, stacking, streaming and per-value morphing are not included.
- Expand the bilingual catalog to 62 components, with categories and release badges, searchable gallery and adjustable live previews. Redesign the VitePress home around the original Mavis artwork, real component interactions, an exportable theme studio, showcases and labelled native recordings.
- Correct reduced-motion documentation styles so they do not impose CSS transitions on Jolt-owned surfaces.
- Declare webpack and webpack-cli directly in native CLI templates so clean Yarn installs can run bundle commands. Stabilize creator CI with the matching official Playwright image.

## 0.1.0-alpha.10 — 2026-11-03

Tenth experimental release, using **Jolt 0.1.0-rc.10**. Keep all four Mavis packages at `0.1.0-alpha.10`; generated projects pin the same release. Existing application sources are preserved when adding another host.

- Add `MPlatform` and `useMavisPlatform()` for intentional Web/native/iOS/Android content, with lazy slots and request-safe SSR identity.
- Add `create-mavis --add-native` and `--add-web` for existing Vue + Vite, Nuxt and NativeScript applications, with isolated dependencies, existing-screen imports, dry-run/JSON plans, package-manager detection and conflict checks.
- Fix valid TypeScript being parsed as TSX by the portability auditor; respect file extensions and Vue script languages while retaining real diagnostics.
- Add shared keyed list layout animation through Jolt and motion regions on rows/columns; add section-relative vertical scroll motion with automatic geometry updates and cleanup.
- Add a shared navigation transition policy and Vue Router/Nuxt/NativeScript adapters, preserving router guards/history, cancellation, native back ownership and Web focus restoration.
- Update generated `#mavis` facades with the new components and shared platform/list composables.

- Add shared `MPopover` and `MMenu` with anchored placement, controlled visibility, dismissal and focus restoration; Web menus add keyboard traversal and typeahead.
- Add `MAppBar` and `MTabBar` using application-owned navigation. TabBar follows the confirmed route and retains native Web link behavior.
- Add `MTimePicker` with localized 12/24-hour drafts, canonical `HH:mm`, inclusive bounds, minute intervals and provisional picker selection. Native uses system time controls; Web keeps labeled selects in the same Sheet. Time-only values do not imply a timezone or an instant.
- Add `MVirtualList` with stable typed item keys, fixed row/viewport heights, bounded Web rendering, native cell recycling and a public scroll handle.
- Add six bilingual catalog demos/references, browser interaction checks, packed-consumer type coverage and the opt-in native collection probe. These components are included in alpha.10.

## 0.1.0-alpha.9 — 2026-11-03

Ninth experimental release, using **Jolt 0.1.0-rc.10**. Keep core, renderers and the project creator at `0.1.0-alpha.9`. Templates pin alpha.9/RC.10. Regenerate a starter or apply the documented changes to existing projects; updating the CLI does not rewrite their source files.

- Add typed `#mavis` imports and app-owned router navigation shared by Vue + Vite SPA, Nuxt SSR/SSG and NativeScript iOS/Android. The directory example shares search, details and editing screens with host-owned persistence and retained drafts.
- Add portability diagnostics and safe named-import migration previews; arbitrary HTML, CSS and device code still require adaptation.
- Restore Web Sheet focus after native dialog close with explicit return-focus targets. Stabilize responsive Stack/Grid measurement and add shared MGrid with token spacing.
- Complete Web Image responsive attributes and stale-load guards. Add services-only installation, selective components and optional Web SVG icons without the default font.
- Align calendar actions within date editors. Add strict localized date entry while preserving ISO models, and explicit-timezone formatting/conversion helpers for Web, iOS and Android.
- Integrate basic and directory examples into the setup wizard, summary and next steps for npm, pnpm and Yarn. Preserve portability/migration commands and validate both examples across all five presets and three managers.

- Refresh the project creator with arrow-key choices, inline name validation, back navigation, a project summary and concise next steps.
- Add npm, pnpm and Yarn selection throughout installation, generated scripts, documentation and prerequisite checks. Shared projects keep Web and NativeScript dependencies separate with manager-specific configuration.
- Fix native starter startup by mounting Welcome directly inside Frame; MScreen already owns its Page, so a second Page wrapper caused a runtime crash.

## 0.1.0-alpha.8 — 2026-11-03

Eighth experimental release, using **Jolt 0.1.0-rc.10**. Keep all four Mavis packages at `0.1.0-alpha.8` and rebuild native apps after upgrading. The project creator pins alpha.8/RC.10; the optional `jolt-native` plugin is not required by these integrations.

- Add experimental shared gradients, shimmer/loaders, text entrances, rolling counters and circular visibility, with explicit platform support and reduced-motion cleanup.
- Add retained scroll headers, anchor preservation, guarded refresh and retained reorder through Jolt, including shared Lustre and Current showcases.
- Add scoped particles/confetti, blur, shape morphing, image effects, symbol effects, keyboard following and bounded circle physics. Image dissolves preserve the application model on cancellation or stale results.
- Add finite gravity, opt-in haptics and scoped sensor values, plus shared Prism, Orbit and Field recipes. Permission and availability remain explicit; unsupported platforms retain documented fallbacks.
- Move Web Sheet to Jolt bottomSheet, add opt-in interactive Dialog, and preserve controlled closure, form focus and moving Combobox positioning.
- Add Web Passage navigation and Gallery glass, zoom/dismiss and keyed return across pagination, reordering and deletion, with focus fallback.
- Pin the official Jolt registry package and remove temporary source-candidate preparation from builds, CI and package consumers.
- Native Frame navigation, native glass, physical sensor/haptic verification and a complete assistive-technology audit remain outside this release. Web APIs remain experimental; Android liquid, system symbols and loading/circular effects retain their documented limitations.

## 0.1.0-alpha.7 — 2026-11-02

Seventh experimental release, using Jolt **0.1.0-rc.9**. Keep all Mavis packages at `0.1.0-alpha.7` and rebuild native apps after upgrading Jolt. The project creator pins the same versions.

- Add shared NumberInput, local searchable MultiSelect and Image with reserved geometry, plus the bilingual Forma showcase.
- Animate choice paint through Jolt, expose experimental hex-color mappings and radius/width bindings, and verify Accordion intrinsic sizing through Reveal.
- Scope native Switch/Radio touch observers to the loaded view and distinguish control/press ownership in performance reports.
- Preserve the shared drag release callback (`velocityX`/`velocityY`) when adapting Jolt RC.9 Web velocity vectors.
- Keep existing Web scroll-size observations across content mutations, preventing resize notification loops in WebKit.
- Keep Afterglow shared-layout destinations stable while their children retain pointer and press motion.
- Upgrade dependency locks, renderer peer minimums, capabilities and generated projects to Jolt RC.9, including its native retained-paint and Web spring fixes.
- The new Jolt gesture, zoom, nested-scroll, header/refresh and reorder integrations remain separate Mavis work (#234–#237).

## 0.1.0-alpha.6 — 2026-11-02

Sixth experimental release, using Jolt **0.1.0-rc.8**. Existing Mavis alpha.5 installations do not gain the Mavis APIs listed here just by upgrading Jolt. Rebuild native apps after dependency changes.

- Add the five-preset project creator, responsive and routed composition, public theme/motion tokens, controlled date drafts, labelled separators, catalog translations and bundled native icon selection.
- Integrate Reveal intrinsic height, shared scalar playback/progress, sequences, timelines, named states and decay, composing with component press.
- Defer Vue/Nuxt surfaces and regions until real DOM insertion through Jolt's lifecycle adapter. Add scoped Web HTML/SVG, keyed item entrances and horizontal LTR/RTL scroll demonstrations.
- Adopt Jolt's paused native replacement fix; validate on Android/iOS and packed Nuxt SSR/SSG consumers. Remove temporary upstream-commit preparation from builds and CI.
- Pin Jolt RC.8 in dependency locks, renderer peer minimums, capabilities and generated projects. The first published creator uses Mavis alpha.6 and Jolt RC.8.

## 0.1.0-alpha.5 — 2026-11-02

Fifth experimental release. It adds Nuxt SSR/static-generation support, shared date/form/file workflows and declared motion regions on Jolt RC.7. Keep all Mavis packages at `0.1.0-alpha.5`, install `@rafaelaugusto/jolt@0.1.0-rc.7`, and rebuild native applications.

- Add child interaction scopes, bounded pointer-follow, opt-in viewport entrances and shared-layout identities through declared Mavis regions. Independent application owners preserve component press and survive replacement/KeepAlive without duplicate resources (#205–#208).
- Add opt-in bounded ownership diagnostics with on-demand inspection and detached snapshots; native reports lifecycle counts without claiming browser channel telemetry (#209).
- Prevent Safari focus visibility adjustments from moving a clicked control before release inside an oversized tab panel.
- Keep Web Sheet/Select motion usable inside animated ancestors, with transactional cleanup and a static usable dialog when enhancement fails (#197).
- Add the shared Afterglow showcase, EN/PT integration guidance and reviewed Web/iOS/Android recordings.

- Add civil-date and date-range editors with themed calendars, explicit bounds, retained partial drafts and deterministic server snapshots (#199).
- Add form groups, actionable error summaries and host-owned cancellable validation, plus controlled steps and pagination with shared Gather recipes (#200, #202, #203).
- Add single-selection async Combobox with typed IDs, cancellation, retained selection, keyboard/IME handling and platform-owned result presentation (#201).
- Add Web/native document selection, temporary previews and application-owned upload progress, retry, cancellation and removal (#204). Native files use the platform document providers; upload transports and persistent/background access remain application responsibilities.

- Extract framework-free Box/Row/Column/Text/Button/Input contracts and a versioned capability manifest; both current Vue renderers retain their public API (#34).
- Preserve Input/textarea, Checkbox, Radio and Slider edits made before Vue hydration, including controlled parent rejection and editor identity (#195).
- Validate Nuxt 4.6.3 production SSR and a statically generated route with packed packages, deterministic appearance, isolated request data and client-owned motion (#157, #158, #196).
- Add bilingual Nuxt/architecture guides, generated contract tables and API/catalog/docs drift checks (#46).
- React/Next, streaming, edge deployment presets, portable compilation and SDUI are not added by this delivery.

## 0.1.0-alpha.4 — 2026-11-02

Fourth experimental release. It expands the NativeScript-Vue and Vue Web component catalog, improves forms and typography, and adds shared Jolt motion, continuous springs, drag/snap and scroll-driven animation. The API can change between alphas; pin exact versions.

### Upgrade from alpha.3

- Both renderers now require `@rafaelaugusto/jolt@0.1.0-rc.6` or a compatible later release. Web consumers install Jolt too, without NativeScript. Rebuild native applications after upgrading.
- Keep all installed Mavis packages at `0.1.0-alpha.4`; their internal core dependency is exact.
- Sheet requires a nonblank `title` or `accessibilityLabel`, including in component types. Button still defaults to `type="button"`; opt into HTML submit/reset behavior on Web.
- `@getcortexlabs/mavis-core/experimental` remains experimental. Motion values belong to one surface/presentation; scroll links are vertical and numeric mappings are bounded. See the [motion guide](https://mavis-ui.getcortexlabs.com/guide/motion) for ownership and platform limits.

### Added

- Selection and forms: `MSwitch`, `MCheckbox` with checked/mixed states, `MRadioGroup` and `MSelect`, with shared typed choices, labels, helper/error states and platform-specific input.
- Feedback and overlays: `MToast`, `MDialog`, `MSkeleton`, `MProgress` and `MAlert`, including queues, controlled decisions, loading, cancellation, failure and retry.
- Composition: `MTabs`, `MAvatar`, `MBadge`, `MListItem`, `MSeparator`, `MAccordion`, `MSegmentedControl`, `MChip` and `MEmptyState` for panels, identities, lists, filters and recovery.
- Theme font families, line rhythm, component defaults and elevation; scoped `MThemeProvider` and portable `MSpan` emphasis (#124, #126, #127).
- Named Input trailing actions that preserve editing focus/selection, including password visibility (#122); decorative Button leading/trailing slots (#125).
- Opt-in Tabs panel caching and application Toast queues that survive route changes (#128, #129).
- Shared Profile, Library, Team, Help Center, Atelier and Morrow showcases with component references and examples.

### Motion

- Shared press/Reveal definitions now execute with Jolt on NativeScript and Web. Live reduced motion settles spatial changes in both renderers; press owns an independent multiplicative layer (#32, #33, #100, #101).
- Experimental Button/Card surfaces support finite playback, input values, continuous spring followers, readonly `.to()` mappings and bindings. Disposal cascades to dependent resources and old handles cannot affect a replacement presentation (#102, #139).
- Responsive Web geometry observation and explicit refresh keep the pivot centered through resize, loading text and delayed fonts without restarting motion or press (#137).
- `MScreen.motionScroll` drives the same numeric recipe on both platforms. Web chooses ScrollTimeline or Jolt's scheduler; native uses the scroll adapter. Links respect reduced motion, partial channel interruption and source/target lifetimes (#188).
- One-axis drag/snap composes with entry, springs and press in the shared Kinetic showcase (#140). Field Guide demonstrates shared scroll motion and responsive geometry. Both include iOS, Android and Web recordings.
- Web Sheet playback and handle drag now use Jolt, preserving controlled dismissal/reopening, body scrolling, viewport changes, focus and cleanup (#141).

### Fixed

- Web Input forwards form attributes, ARIA and editing listeners to its editor; Button supports submit/reset. Browser Enter submission preserves component submit handlers and controlled reset values (#119, #120).
- Input `focus()` and `blur()` remain available in inferred component/template ref types on both renderers (#121). Trailing action positioning no longer overwrites a Jolt-owned transform during parent updates.
- Short choice labels retain their word width in constrained Web layouts; native choice labels contribute to intrinsic sizing (#123).
- Sheet rejects blank names and uses a trimmed title/label fallback (#130). Native Sheet reserves its handle/header above the scroll viewport so the final option stays reachable.
- Native percentage widths use the parent's content area, excluding padding and borders. Explicit widths inside a Column or Card keep their size; auto widths fill the available space (#93).
- Native press release, disable, theme refresh and cleanup preserve the application's current scale instead of restoring the scale captured at installation (#100).
- iOS Text, Button and Input follow the system Dynamic Type curve for their text style. Headings grow less than body text, while explicit min/max accessibility scales remain respected (#72).
- Android Input defers focus styling until touch dispatch finishes, avoiding the first-tap focus problem. Native Sheet safe-area coverage is corrected on iOS.

### Validation and limits

- 267 unit/SSR tests and 281 Chromium/WebKit cases passed, with five intentional browser skips. Library/docs builds, formatting and strict template types passed.
- Jolt RC.6 was exercised in full iOS/Android builds and 32 native presentation/lifecycle checks per platform. Clean Web/SSR, NativeScript Webpack and NativeScript Vite consumers and installed-package browser interactions are covered by the release checks.
- Motion recordings use simulator/emulator and browser input. Native automated touch/lifecycle probes include synthetic dispatch; this release does not establish physical-device performance or a complete assistive-technology audit.
- SSR consumer checks cover rendering. Nuxt/Next integrations, portable authorship, new framework adapters and server-driven UI remain roadmap work; they are not included in this release.
- Native runtime baselines remain Core 9.1.3, NativeScript-Vue 3.1.3, Android 9.1.1 and iOS 9.1.0. Web consumers use Vue 3.5.42 and Vite 6.4.5; the native Vite consumer uses `@nativescript/vite` 8.0.21. Device/IME coverage and the VoiceOver status-insertion case (#54) remain incomplete.

## 0.1.0-alpha.3 — 2026-10-31

Third experimental release. It adds the Sheet and keyboard dismissal in Screen, makes nested native layouts measure in linear time, and fixes the style patch that reset plain attributes on re-render. Pin exact versions; the API can still change between alpha versions.

### Performance

- The native layout adapters remember the last measurement of each Mavis layout, label and button while nothing in its subtree requests layout, and answer repeated or exact-for-the-same-size requests from that record (#56). Core and the flex adapters measured nested containers again on every pass, so leaves were measured an exponential number of times; the memo keeps that linear. The Java adapter also stops forcing child layout on Mavis containers. Measurements before and after are recorded in `test/performance/baseline`.

### Fixed

- Row, Column, Box, Card and Reveal no longer write padding, radius, width, height and background keys for props that were not given (#65). The style patch of a re-render used to reset a plain attribute such as `paddingTop` or `borderRadius` set on the element, so a status badge lost its pill shape when its status changed; on the Web the host's CSS now keeps applying for the same keys.

### Added

- `MScreen` puts the software keyboard away on a tap outside the editor and, when it scrolls, on a drag towards the keyboard (#61). On NativeScript the page container observes the touches without consuming them, so buttons, cards and sheets keep receiving them; a touch that starts on an editor keeps the keyboard. On the Web the browser already blurs on a tap outside, and Screen adds the drag dismissal. `dismissKeyboard=false` keeps the keyboard, for example in a message composer.
- `MSheet` presents content and actions in a layer above the screen on both renderers, controlled by `v-model:open` and reporting every close with a reason (`button`, `backdrop`, `escape`, `back`, `swipe` or `program`) (#29). On NativeScript the panel is an in-page bottom sheet driven by Jolt inside an `MScreen`, with a drag handle, content or full-height snap, scrim, keyboard following and Android back; `createMavis` accepts `claimSystemBack` so a router such as vue-router-ns hands the back press to an open sheet first. On the Web it is a modal `<dialog>` with contained focus, Escape, scrim click and a CSS entrance that respects reduced motion. The catalog, docs and template types include the new component.

### Tested toolchains

Same as the second alpha, with the API 36 emulator available again for the layout, performance and keyboard checks (a temporary AVD created with the Google Play arm64 image) and the iOS 26.2 simulator for everything; no physical device this time. Jolt stays at 0.1.0-rc.1 as the peer dependency; the Sheet uses its bottom sheet, present since beta.17. With vue-router-ns, pass `claimSystemBack` to `createMavis` so Android back reaches an open sheet first.

## 0.1.0-alpha.2 — 2026-10-31

Second experimental release. It adds icons and system appearance and fixes the two issues reported by the first app built on the alpha. Pin exact versions; the API can still change between alpha versions.

### Added

- `MButton` takes `icon` and `trailingIcon`, rendered from the bundled Lucide font beside the text in both renderers; an icon-only button requires `accessibilityLabel`. `MInput` draws `icon` and `trailingIcon` inside the editor box, muted or `danger` with an error, with the editor padding adjusted (#60).
- `MIcon` renders the bundled Lucide icon font on NativeScript and Web, with `name`, `size` (sm/md/lg or a number), theme `tone` and an optional accessible `label`; without a label the icon is decorative (#30). The native package ships `fonts/lucide.ttf` to copy into the app's `fonts` folder, the Web stylesheet loads `fonts/lucide.woff2`, and `IconName` lists the 1998 canonical names of Lucide 1.65.0 (ISC). The catalog, docs and template types include the new component.
- `createMavis({ theme, darkTheme, appearance })` follows the device appearance by default on NativeScript and Web, with `appearance` and `setAppearance` on the theme context for explicit `light`/`dark` overrides or returning to `system` (#27). `setTheme` keeps working and pins the chosen theme. Listeners are released when the app unmounts; server rendering uses `theme` and is documented in the themes guide. The catalog apps follow the device and their switch cycles through the opposite appearance and back to the system.

### Fixed

- Platform-specific modules are imported without a file extension, so `@nativescript/vite` builds bundle the Mavis iOS and Android files instead of the shared Core fallbacks (#58). The package consumer checks now build a Vite app for both platforms.
- NativeScript Core views keep their requested or content height inside a Column on iOS and Android, even when the content exceeds a Screen without scrolling (#59). Children that set `flexShrink` themselves keep that value and shrink only on real overflow: the iOS and Android adapters now keep row gaps through Core's growth and shrink passes, which previously measured a Column shorter by the sum of its gaps.
- A Box without `height` measures its tallest layer instead of filling the available height; explicit heights and Row stretching still fill every layer (#59). Box now has its own native class on both platforms, including a Java source for Android.

### Documentation

- `@nativescript/vite` compiles hyphenated tags as native elements; write `MButton` and `MRow` there.

### Tested toolchains

Same as the first alpha, plus `@nativescript/vite` 8.0.21 with Vite 8.3.5 in the package consumer checks and a physical ASUS Z017DC on Android 8.0 for the appearance and icon checks; the API 36 emulator was unavailable for this release. The custom icon font requires copying `fonts/lucide.ttf` into the app's `fonts` folder.

## 0.1.0-alpha.1 — 2026-10-30

First experimental release for testing in real apps. API and behavior may change between alpha versions; pin exact versions and review updates before upgrading.

### Packages

- `@getcortexlabs/mavis`: NativeScript renderer, with Vue components under `/vue`.
- `@getcortexlabs/mavis-core`: shared themes, layout values and component contracts; optional Vue context under `/vue`.
- `@getcortexlabs/mavis-web`: Vue Web renderer, with required `style.css` import.

All three use `0.1.0-alpha.1`, the npm `alpha` tag and the MIT license. The earlier `@mavis-ui/*` names were local development names and were never published.

### Included

Screen, Row, Column, Box, Card, Text, Button, Input, Slider and Reveal; Mavis and Midnight themes; shared Vue props and global template types. The catalog and Showcase demonstrate shared screens between NativeScript and Web. Jolt is a required native peer; Web motion uses CSS while the Jolt Web backend is pending.

The native package includes Android Java sources and Gradle configuration, along with platform-specific JavaScript. No generated AAR, sample app, website artwork or diagnostic probe is included. Web styles include an explicit TypeScript declaration for strict side-effect imports.

### Tested toolchains

| Consumer         | Versions                                                            |
| ---------------- | ------------------------------------------------------------------- |
| Shared tooling   | Node 22.23.3, TypeScript 6.0.3, vue-tsc 3.3.13                      |
| NativeScript Vue | Core 9.1.3, NativeScript-Vue 3.1.3, Jolt 0.1.0-rc.1, webpack 5.0.39 |
| Native runtimes  | Android 9.1.1 / API 36 emulator; iOS 9.1.0 / iOS 26.2 simulator     |
| Vue Web          | Vue 3.5.42, Vite 6.4.5; Chromium and WebKit                         |

These are tested configurations, not a guarantee for every version allowed by peer ranges. Earlier component checks also exercised a physical iPhone 17 Pro on iOS 27.2 beta; the release packaging checks use simulators. See [consumer checks](test/package-consumers.md) and the existing native test guides for the validation boundaries.

### Known limitations

- **Native performance:** deep Row/Column trees and catalog startup have measured high costs. Keep initial compositions shallow. Optimization is tracked in [#56](https://github.com/getcortexlabs/mavis-ui/issues/56); this release does not fix it.
- **VoiceOver:** a newly inserted offscreen status can be skipped on the first cycle, although later controls remain reachable ([#54](https://github.com/getcortexlabs/mavis-ui/issues/54)). The earlier repeated-loading navigation block was fixed in #53.
- **Devices and input:** physical Android, low-end hardware, release-mode performance, CJK IMEs and floating keyboards are not fully validated ([#23](https://github.com/getcortexlabs/mavis-ui/issues/23)). Input remains experimental.
- **Screen:** one Screen per native page; Android hosts must use `adjustResize`. iOS keyboard adjustment covers docked keyboards. Arbitrary nested vertical scrolling is not supported. Web hosts using `viewport-fit=cover` own their CSS safe-area spacing.
- **Web motion:** no Jolt browser backend yet ([#32](https://github.com/getcortexlabs/mavis-ui/issues/32)). Native and Web share the component contract, not pixel-identical rendering or platform services.

Website artwork has separate attribution and unresolved permissions recorded in [ASSETS.md](ASSETS.md) and [#44](https://github.com/getcortexlabs/mavis-ui/issues/44). It is excluded from all npm packages.
