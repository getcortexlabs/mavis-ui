import { advancedEnglishReferences } from '../advanced-reference'
import { dashboardEnglishReferences } from '../dashboard-reference'
import { creativeEnglishReferences } from '../creative-reference'
import { screenComponentEnglishReferences } from '../screen-component-reference'
import { interactiveEnglishReferences } from '../interactive-reference'
import type { ComponentReference } from '../reference'

/** English reference copy; API names and defaults match the shared contract. */
export const englishReferences: Record<string, ComponentReference> = {
  ...interactiveEnglishReferences,
  ...advancedEnglishReferences,
  ...dashboardEnglishReferences,
  ...creativeEnglishReferences,
  ...screenComponentEnglishReferences,
  'command-palette': {
    usage:
      '<MCommandPalette v-model:open="open" :items="commands" label="Commands" @select="run" />',
    properties: [
      {
        name: 'items',
        type: 'readonly CommandItem[]',
        defaultValue: 'required',
        description:
          'Commands with value, label, description, group, keywords, icon, disabled and a display-only shortcut.',
      },
      {
        name: 'open / query',
        type: 'boolean / string',
        defaultValue: 'false / local',
        description:
          'Controlled presentation and optionally controlled search. A local query resets on close.',
      },
      {
        name: 'shortcut / loading / disabled',
        type: 'boolean',
        defaultValue: 'false',
        description:
          'Opt-in Cmd/Ctrl+K on Web; loading blocks selection while the application fetches.',
      },
      {
        name: 'label / searchLabel / placeholder / emptyLabel / loadingLabel / closeLabel',
        type: 'string',
        defaultValue: 'see source',
        description: 'Localizable title, search and state labels.',
      },
      {
        name: 'returnFocus',
        type: 'SheetReturnFocus',
        defaultValue: 'captured opener',
        description: 'Web focus destination after closing, inherited from MSheet.',
      },
    ],
    events: [
      {
        name: 'update:open',
        payload: 'boolean',
        description: 'Notifies the application.',
      },
      {
        name: 'update:query',
        payload: 'string',
        description: 'Notifies the application.',
      },
      {
        name: 'select',
        payload: 'ChoiceValue, CommandItem',
        description: 'Notifies the application.',
      },
    ],
    behavior:
      'Search ignores accents and matches all space-separated terms against labels, descriptions, groups and keywords. Arrow keys move from search to enabled actions; Home/End work inside results, Enter selects, Escape closes. The Web shortcut is opt-in, ignores editable targets, composition and other dialogs, and is released on unmount. Native uses a Sheet with search and explicit actions. The application executes commands and owns async work; selection closes the palette. Item shortcut strings are hints, not registered hotkeys.',
  },
  'navigation-rail': {
    usage:
      '<MNavigationRail v-model:collapsed="collapsed" :modelValue="routeKey" :groups="groups" label="Workspace" />',
    properties: [
      {
        name: 'groups',
        type: 'readonly NavigationGroup[]',
        defaultValue: 'required',
        description:
          'Unique groups with key, label and NavigationItem entries. Item values are unique across groups.',
      },
      {
        name: 'modelValue',
        type: 'ChoiceValue or null',
        defaultValue: 'null',
        description:
          'App-owned current destination; successful routing determines the active item.',
      },
      {
        name: 'collapsed / collapsible / disabled',
        type: 'boolean',
        defaultValue: 'false / true / false',
        description: 'Compact 80 px/DIP or expanded 256 px/DIP presentation.',
      },
      {
        name: 'header / footer',
        type: 'slots',
        defaultValue: '—',
        description: 'Receive { collapsed } for branding and account content.',
      },
    ],
    events: [
      {
        name: 'update:collapsed',
        payload: 'boolean',
        description: 'Notifies the application.',
      },
      {
        name: 'error',
        payload: 'unknown',
        description: 'Notifies the application.',
      },
    ],
    behavior:
      'Links use the installed Mavis navigation adapter or an item navigate callback. Web retains href and browser link behavior. Current state is controlled by the application rather than optimistic clicks. Compact buttons keep accessible names and badge context. Jolt animates current-item signals and button feedback; the application chooses when to collapse for its layout.',
  },
  breadcrumb: {
    usage: '<MBreadcrumb :items="path" :maxItems="3" label="Breadcrumb" />',
    properties: [
      {
        name: 'items',
        type: 'readonly BreadcrumbItem[]',
        defaultValue: 'required',
        description:
          'Unique key, label and ancestor href; navigate is optional. Last entry is the current page.',
      },
      {
        name: 'maxItems',
        type: 'number',
        defaultValue: '4',
        description:
          'At least two. Extra middle ancestors remain reachable through the expansion button.',
      },
      {
        name: 'label / expandLabel',
        type: 'string',
        defaultValue: 'Breadcrumb / Show full path',
        description: 'Localizable navigation and expansion labels.',
      },
    ],
    events: [
      {
        name: 'error',
        payload: 'unknown',
        description: 'Notifies the application.',
      },
    ],
    behavior:
      'The last entry is text with current-page semantics. Ancestors are real MLink destinations. Expansion shows the entire path without a second navigation model, and resets when path identities change. Long paths wrap on narrow screens. Separators are decorative.',
  },
  tooltip: {
    usage:
      '<MTooltip triggerLabel="About this metric" text="Active members in the last seven days." />',
    properties: [
      {
        name: 'text / triggerLabel',
        type: 'string',
        defaultValue: 'required',
        description: 'Plain help text and an explicit accessible name for its information button.',
      },
      {
        name: 'icon / variant',
        type: 'IconName / ButtonVariant',
        defaultValue: 'info / ghost',
        description: 'Appearance of the component-owned trigger.',
      },
      {
        name: 'placement',
        type: 'PopoverPlacement',
        defaultValue: 'top-start',
        description:
          'top-start, top-end, bottom-start or bottom-end; flips and clamps to available space.',
      },
      {
        name: 'delay / disabled',
        type: 'number / boolean',
        defaultValue: '350 / false',
        description: 'Web hover delay in milliseconds. Focus and touch do not wait.',
      },
    ],
    events: [],
    behavior:
      'Web help opens on focus, hover or click, remains hoverable and closes on Escape without moving focus. Content is non-interactive. Native exposes the same help through an explicit labelled trigger and MPopover with system-back dismissal; it does not require long press. This component owns its trigger rather than wrapping an arbitrary control. Keep essential instructions visible in the form instead of relying only on a tooltip.',
  },
  timeline: {
    usage:
      '<MTimeline :items="activity" label="Project activity"><template #default="{ item }"><MText :text="item.description" /></template></MTimeline>',
    properties: [
      {
        name: 'items',
        type: 'readonly TimelineItem[]',
        defaultValue: 'required',
        description: 'Stable key, title, optional description, formatted time, icon and status.',
      },
      {
        name: 'statusLabels',
        type: 'Record<TimelineStatus, string>',
        defaultValue: 'English labels',
        description: 'complete, current, upcoming and error; status is readable without color.',
      },
      {
        name: 'label / emptyLabel',
        type: 'string',
        defaultValue: 'required / No activity yet',
        description: 'Accessible list name and empty-state copy.',
      },
      {
        name: 'default',
        type: 'slot',
        defaultValue: '—',
        description: 'Receives { item, index }; content remains mounted as status changes.',
      },
    ],
    events: [],
    behavior:
      'A chronological list in application order, with themed connectors, state icons and Jolt entry/indicator motion. No autonomous progress or timer is inferred. Time is already formatted by the application; use formatDateTime for locale/timezone-aware timestamps. Keep stable keys when replacing or reordering data. Reduced motion follows the Mavis motion context.',
  },
  chart: {
    usage:
      '<MChart v-model="selection" v-model:hiddenSeries="hidden" :categories="days" :series="series" label="Activity" type="line" />',
    properties: [
      {
        name: 'categories / series',
        type: 'readonly ChartCategory[] / readonly ChartSeries[]',
        defaultValue: 'required',
        description:
          'Stable keys and labels; each series has one finite number or null per category.',
      },
      {
        name: 'type / height',
        type: 'line or bar / number',
        defaultValue: 'line / 240',
        description: 'Plot type and height (120–800 px/DIP). Up to 100 categories and 8 series.',
      },
      {
        name: 'domain',
        type: 'readonly [number, number]',
        defaultValue: 'automatic',
        description:
          'Increasing finite bounds containing all values. Automatic domain includes zero.',
      },
      {
        name: 'modelValue / hiddenSeries',
        type: 'ChartSelection or null / readonly ChoiceValue[]',
        defaultValue: 'null / []',
        description: 'Selection by { category, series } key and controlled legend visibility.',
      },
      {
        name: 'formatValue / showData',
        type: 'function / boolean',
        defaultValue: 'string / false',
        description: 'Formatting callback and initial textual data expansion.',
      },
      {
        name: 'label / description / categoryLabel / seriesLabel',
        type: 'string',
        defaultValue: 'see source',
        description: 'Heading, context and accessible selection labels.',
      },
      {
        name: 'showDataLabel / hideDataLabel / emptyLabel / missingLabel / clearLabel',
        type: 'string',
        defaultValue: 'English labels',
        description: 'Localizable actions and empty/missing states.',
      },
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'ChartSelection or null',
        description: 'Notifies the application.',
      },
      {
        name: 'update:hiddenSeries',
        payload: 'ChoiceValue[]',
        description: 'Notifies the application.',
      },
    ],
    behavior:
      'Categorical line and grouped bar charts share the same normalized geometry. Null creates a gap, never an invented zero. Negative values share a zero baseline; hiding a series keeps the domain stable. Web uses SVG; native uses bounded native shapes, without a WebView. Tap/click chooses a nearby series, and labelled selectors provide an alternative on every platform. Show data exposes all values, including hidden series. Jolt animates plot entry/data replacement; no per-value morph or axis interpolation is promised. Colors are six-digit hex or theme defaults; color is supplemented by labels and textual values. This first version does not implement time axes, zoom, stacking, financial charts or streaming-scale datasets.',
  },

  'data-table': {
    usage:
      '<MDataTable :items="rows" :columns="columns" v-model:sort="sort" v-model:selected="selected" label="Collections" selectable />',
    properties: [
      {
        name: 'items / itemKey',
        type: 'readonly object[] / string or function',
        defaultValue: 'required / id',
        description: 'Current page and stable identity.',
      },
      {
        name: 'columns',
        type: 'readonly DataColumn[]',
        defaultValue: 'required',
        description: 'Key, label, width, alignment and optional value accessor.',
      },
      {
        name: 'sort / v-model:sort',
        type: 'DataSort or null',
        defaultValue: 'null',
        description: 'Cycles ascending, descending and unsorted; the application sorts the data.',
      },
      {
        name: 'selected / v-model:selected',
        type: 'readonly ChoiceValue[]',
        defaultValue: '[]',
        description: 'Selected keys; selection on other pages is preserved.',
      },
      {
        name: 'selectable / rowDisabled / rowLabel',
        type: 'boolean / function / function',
        defaultValue: 'false / — / —',
        description: 'Optional selection, row availability and accessible row label.',
      },
      {
        name: 'disabled / loading',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Prevent changes; loading presents a progress indicator.',
      },
    ],
    behavior:
      'The table receives the current page. Sorting, filtering, requests and pagination belong to the application; place MPagination in footer. Slots cell and cell:key receive item, itemKey, column, value and index; actions and empty are also available. Web uses an HTML table with headers and aria-sort. Native columns scroll horizontally and cells retain their column labels. Numeric and string identities remain distinct. This is not an editable grid or virtualized list: paginate large datasets.',
  },
  carousel: {
    usage:
      '<MCarousel v-model="current" :items="slides" itemKey="id" label="Stories"><template #default="{ item }">…</template></MCarousel>',
    properties: [
      {
        name: 'items / itemKey',
        type: 'readonly T[] / string or function',
        defaultValue: 'required / id',
        description: 'Slides with unique stable keys.',
      },
      {
        name: 'modelValue / v-model',
        type: 'ChoiceValue or null',
        defaultValue: 'null',
        description: 'Active slide key; absent or removed selection displays the first.',
      },
      {
        name: 'loop / disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Wrap around the ends; disable interaction.',
      },
      {
        name: 'previousLabel / nextLabel / slideLabel / emptyLabel',
        type: 'string',
        defaultValue: 'Previous slide / Next slide / Slide / No slides',
        description: 'Localizable labels.',
      },
    ],
    behavior:
      'Buttons, indicators, Web arrow keys and horizontal swipe change slides. Jolt animates entry and respects reduced motion. There is no autoplay. Only the active slide is mounted; keep drafts in the application by key. The slot receives item, index and itemKey. Web controls inside a slide do not start swipes, and vertical scrolling remains available. Give slides stable geometry to avoid layout jumps. Indicators are intended for small collections such as onboarding and featured stories.',
  },
  'range-slider': {
    usage: '<MRangeSlider v-model="budget" :min="0" :max="1000" :step="25" label="Budget" />',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'readonly [number, number]',
        defaultValue: '[0, 100]',
        description: 'Ordered pair; handles cannot cross.',
      },
      {
        name: 'min / max / step',
        type: 'number',
        defaultValue: '0 / 100 / 1',
        description: 'Finite bounds and a positive step; decimals are supported.',
      },
      {
        name: 'lowerLabel / upperLabel',
        type: 'string',
        defaultValue: 'Minimum / Maximum',
        description: 'Endpoint names.',
      },
      {
        name: 'formatValue',
        type: '(number) => string',
        defaultValue: '—',
        description: 'Display formatting; the model stays numeric.',
      },
      {
        name: 'disabled / readonly',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Prevents changes.',
      },
    ],
    behavior:
      'On Web, two range inputs share the track while keeping independent focus and identity, even when they overlap. Native 48-DIP touch handles respond to pan; labelled MNumberInput fields provide precise editing, keyboard and assistive access. Jolt animates native handle feedback. The numeric track runs left to right. Values snap and clamp; nonfinite values, invalid bounds and reversed pairs are rejected.',
  },
  calendar: {
    usage:
      '<MCalendar v-model="dates" mode="range" label="Your next escape" initialMonth="2026-11" locale="en-US" />',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'CivilDate or DateRange or null',
        defaultValue: 'null',
        description: 'ISO date in single mode, start/end object in range mode.',
      },
      {
        name: 'mode',
        type: 'single or range',
        defaultValue: 'single',
        description: 'Single date or inclusive range.',
      },
      {
        name: 'min / max / unavailableDates',
        type: 'CivilDate / CivilDate / readonly CivilDate[]',
        defaultValue: '— / — / []',
        description: 'Bounds and unavailable dates.',
      },
      {
        name: 'initialMonth / locale / firstDayOfWeek',
        type: 'string / en-US or pt-BR / number',
        defaultValue: '2000-01 / en-US / locale',
        description: 'Deterministic empty month; no implicit clock access.',
      },
      {
        name: 'disabled / readonly',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Prevents selection; readonly permits month browsing.',
      },
    ],
    behavior:
      'Inline calendar using the same civil-date arithmetic as the date pickers. Dates are not timestamps and no timezone is applied. The first click sets start; the second completes the range and may precede start. A range spanning an unavailable date emits invalid and preserves the first endpoint. Clicking after a complete range starts a new one. Mounting never steals focus. Web provides one Tab stop, arrows, Home/End and PageUp/PageDown; native uses buttons and horizontal scrolling for large text. Use footer for a legend or actions.',
  },
  rating: {
    usage: '<MRating v-model="score" :step="0.5" label="How was your stay?" />',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'number',
        defaultValue: '0',
        description: 'Rating from zero through max.',
      },
      {
        name: 'max / step',
        type: 'number / 1 or 0.5',
        defaultValue: '5 / 1',
        description: 'One to ten stars, whole or half increments.',
      },
      {
        name: 'readonly / disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Summary without controls or disabled controls.',
      },
      {
        name: 'clearable / clearLabel',
        type: 'boolean / string',
        defaultValue: 'true / Clear rating',
        description: 'Explicit action to clear.',
      },
      {
        name: 'formatValue',
        type: '(value, max) => string',
        defaultValue: '—',
        description: 'Score text and accessible names.',
      },
    ],
    behavior:
      'Actionable stars choose whole values and use MButton’s Jolt feedback. With step 0.5, a slider selects half stars by touch, keyboard or assistive input. Readonly displays icons and a textual score without actions. Values clamp and snap; use the numeric model rather than extracting icon text.',
  },
  'tree-view': {
    usage:
      '<MTreeView v-model="selected" v-model:expanded="expanded" :nodes="nodes" label="Files" @load="loadChildren" />',
    properties: [
      {
        name: 'nodes',
        type: 'readonly TreeNode[]',
        defaultValue: 'required',
        description: 'key, label, disabled, children and hasChildren.',
      },
      {
        name: 'modelValue / v-model',
        type: 'ChoiceValue or null',
        defaultValue: 'null',
        description: 'Selected key, independent of expansion.',
      },
      {
        name: 'expanded / v-model:expanded',
        type: 'readonly ChoiceValue[]',
        defaultValue: '[]',
        description: 'Expanded branch keys.',
      },
      {
        name: 'loadingKeys',
        type: 'readonly ChoiceValue[]',
        defaultValue: '[]',
        description: 'Loading branches; prevents repeated requests while waiting.',
      },
      {
        name: 'disabled / emptyLabel',
        type: 'boolean / string',
        defaultValue: 'false / No items',
        description: 'Global disabled state and empty fallback.',
      },
    ],
    behavior:
      'Keys are unique across the entire tree; cycles and depth over 100 are rejected. hasChildren with absent children emits load when expanded. The application fetches children, updates nodes and controls loadingKeys; use [] for an empty result. Requests, errors and cancellation belong to the application. Web provides roving tabindex, arrow navigation, Home/End, initial-letter search and Enter/Space; expansion arrows follow the left/right tree convention. Native exposes explicit expand/select actions. MReveal/Jolt animates expansion with reduced-motion support. Cascading selection and virtualization are not part of this version.',
  },
  popover: {
    usage: '<MPopover v-model:open="open" label="Filters" triggerLabel="Filters">…</MPopover>',
    properties: [
      {
        name: 'open / v-model:open',
        type: 'boolean',
        defaultValue: 'false',
        description: 'App-owned visibility.',
      },
      {
        name: 'label / triggerLabel',
        type: 'string',
        defaultValue: 'required',
        description: 'Accessible panel name and visible trigger text.',
      },
      {
        name: 'placement',
        type: 'bottom-start / bottom-end / top-start / top-end',
        defaultValue: 'bottom-start',
        description: 'Preferred anchor alignment; flips and clamps when needed.',
      },
      {
        name: 'width',
        type: 'number',
        defaultValue: '280',
        description: 'Preferred CSS-pixel/DIP panel width.',
      },
      {
        name: 'padding',
        type: 'token / number',
        defaultValue: 'md',
        description: 'Panel spacing.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Prevents opening and requests closure.',
      },
    ],
    behavior:
      'An anchored surface for filters and small forms. The component owns its trigger, positioning and return focus. The default slot receives close(). update:open requests visibility changes; close(reason) identifies trigger, outside, Escape, Android back, selection or programmatic requests. opened runs after presentation. Web follows anchor/viewport size, scroll and RTL; native dismisses on ancestor scrolling. Escape/outside interaction closes the surface; native Android back participates in the installed navigation back claimant. Native requires an MScreen ancestor. Panels stay within the safe viewport; use Sheet for a long or full-screen workflow. Popover is nonmodal on Web; native presents a modal accessibility layer over its screen. Web Tab can leave the panel. Open panels are deferred until client mount during SSR. Theme and dependency injections remain those of the declaration.',
  },
  menu: {
    usage:
      '<MMenu v-model:open="open" label="Actions" triggerLabel="Actions" :items="actions" @select="onAction" />',
    properties: [
      {
        name: 'items',
        type: 'MenuItem[]',
        defaultValue: 'required',
        description:
          'Actions with stable value, label, icon, disabled and destructive; or group/separator with unique key.',
      },
      {
        name: 'open / v-model:open',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Controlled visibility.',
      },
      {
        name: 'label / triggerLabel',
        type: 'string',
        defaultValue: 'required',
        description: 'Menu name and trigger text.',
      },
      {
        name: 'placement / width',
        type: 'Popover props',
        defaultValue: 'bottom-start / 280',
        description: 'Shared anchored presentation.',
      },
    ],
    behavior:
      'A single-level action menu built on Popover. select(value, item) emits only for an enabled action, then requests closure with reason select. String and numeric identities stay distinct. Web supports Enter/Space, Up/Down, Home/End, single-character typeahead and Escape with return focus. Disabled actions are skipped by arrow navigation. Groups are visual headings; separators are not actions. Native uses accessible Mavis buttons in an anchored layer. No submenu, checkbox/radio action state, or async transaction ownership is implied; keep long tasks and confirmations in the application.',
  },
  'app-bar': {
    usage: '<MAppBar title="Library" back><template #actions>…</template></MAppBar>',
    properties: [
      { name: 'title', type: 'string', defaultValue: 'required', description: 'Screen heading.' },
      {
        name: 'subtitle',
        type: 'string',
        defaultValue: '—',
        description: 'Optional supporting text.',
      },
      { name: 'back', type: 'boolean', defaultValue: 'false', description: 'Shows a back action.' },
      {
        name: 'backLabel',
        type: 'string',
        defaultValue: 'Back',
        description: 'Accessible action label.',
      },
      {
        name: 'navigateBack',
        type: '() => void / Promise',
        defaultValue: '—',
        description: 'Overrides the installed navigation back handler.',
      },
    ],
    behavior:
      'A screen header with leading and actions slots. The back action awaits the app navigation handler and emits back on completion or error on failure. Install navigation once with createRouterNavigation for Vue Router, Nuxt or vue-router-ns, or pass navigateBack. This component does not create a native Page, router, sticky positioning or a second safe-area inset. Native MScreen owns its safe area. Place a header outside scrollable content (or use the existing retained-header recipe) when it must remain visible. The title wraps rather than clipping enlarged text.',
  },
  'tab-bar': {
    usage: '<MTabBar :modelValue="currentRoute" :items="destinations" label="Main navigation" />',
    properties: [
      {
        name: 'items',
        type: 'NavigationItem[]',
        defaultValue: 'required',
        description: 'Stable value, label, href and optional icon, badge, disabled, navigate.',
      },
      {
        name: 'modelValue',
        type: 'string / number / null',
        defaultValue: 'null',
        description: 'Current route identity, supplied by the app.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Navigation region name.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Disables all destinations.',
      },
      {
        name: 'safeArea',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Opt-in Web bottom viewport inset; native already uses MScreen.',
      },
    ],
    behavior:
      'Route navigation with real Web links and native actions using the installed navigation service. Derive modelValue from the confirmed route; no optimistic selection or update:modelValue event bypasses route guards. Modified Web clicks retain normal link behavior. error forwards navigation failures. Current links expose aria-current="page"; native accessible names include currentLabel. Badges are included in action names. Use MTabs for local content panels. The bar participates in normal layout; the host decides its position. A small set of short labels is recommended; there is no overflow menu. Keep native MScreen safe-area ownership and enable the Web inset only when placing the bar against the viewport bottom.',
  },
  'time-picker': {
    usage:
      '<MTimePicker v-model="time" label="Meeting time" min="08:00" max="18:00" :minuteStep="15" />',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'HH:mm / null',
        defaultValue: 'null',
        description: 'Canonical wall-clock time.',
      },
      {
        name: 'draft / v-model:draft',
        type: 'string',
        defaultValue: '—',
        description: 'Optional controlled editor text.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Visible field label.',
      },
      {
        name: 'locale',
        type: 'en-US / pt-BR',
        defaultValue: 'en-US',
        description: 'Default display cycle.',
      },
      {
        name: 'hourCycle',
        type: 'h12 / h23',
        defaultValue: 'locale',
        description: 'Explicit 12/24-hour display.',
      },
      {
        name: 'min / max',
        type: 'HH:mm',
        defaultValue: '00:00 / 23:59',
        description: 'Inclusive same-day bounds.',
      },
      {
        name: 'minuteStep',
        type: 'number',
        defaultValue: '1',
        description: 'Divisor of 60 from 1 to 30.',
      },
      {
        name: 'disabled / readonly',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Prevents edits and picker opening.',
      },
      {
        name: 'name',
        type: 'string',
        defaultValue: '—',
        description: 'Web hidden field submits the canonical model.',
      },
    ],
    behavior:
      'The editor displays h:mm AM/PM for en-US and HH:mm for pt-BR unless hourCycle is explicit. Incomplete text remains visible without replacing the last valid model. validityChange reports empty, valid, incomplete, invalid, range or step; use it to block application submission while a draft is invalid. update:draft, focus and blur are shared events; public handles provide focus()/blur(). Picker changes are provisional until Apply; Cancel leaves the model unchanged. Web uses labeled hour/minute/period controls; iOS and Android use the system TimePicker in MSheet. Bounds and interval are validated before confirmation; native wheels may show a value that cannot be confirmed. required disables Clear; business validation remains app-owned. Localize action, field and error labels.\n\nA time alone is not an instant: there is no timezone or automatic DST conversion on this component. Combine a civil date, time and explicit timezone in your domain before producing an instant, and use the existing formatDateTime helper to display that instant. formatTime, parseTime and validateTime perform deterministic time-only formatting and validation on all renderers, including SSR. Overnight min/max ranges are rejected.',
  },
  'virtual-list': {
    usage:
      '<MVirtualList :items="items" itemKey="id" :rowHeight="72" :height="360" label="Collections"><template #default="{ item }">…</template></MVirtualList>',
    properties: [
      {
        name: 'items',
        type: 'readonly T[]',
        defaultValue: 'required',
        description: 'Collection owned by the app.',
      },
      {
        name: 'itemKey',
        type: 'keyof T / (item: T) => string or number',
        defaultValue: 'id',
        description: 'Unique stable identity; index keys are unsuitable for reorder.',
      },
      {
        name: 'rowHeight',
        type: 'number',
        defaultValue: 'required',
        description: 'Fixed positive row height in CSS px / DIP.',
      },
      {
        name: 'height',
        type: 'number',
        defaultValue: 'required',
        description: 'Finite scroll viewport height.',
      },
      {
        name: 'overscan',
        type: 'number',
        defaultValue: '3',
        description: 'Extra Web rows; native owns recycling buffers.',
      },
      {
        name: 'initialIndex',
        type: 'number',
        defaultValue: '0',
        description: 'Initial scroll destination.',
      },
      {
        name: 'label / emptyLabel',
        type: 'string',
        defaultValue: 'required / No items',
        description: 'List name and empty fallback.',
      },
    ],
    behavior:
      'A vertical, fixed-row-height collection. Web renders only the viewport plus overscan; NativeScript uses its recycled ListView. The typed default slot receives { item, index, itemKey }; empty replaces the empty fallback. scrollToIndex(index) scrolls through a public handle and rejects an invalid index. Use immutable array replacement or reactive items. Duplicate/missing keys fail early, and numeric/string keys stay distinct. Reordering preserves the first visible logical item where possible (native restores its row, Web also retains the pixel offset).\n\nKeep drafts, selection and loading state in the item or an external store keyed by identity. Cell-local state is not retained after unmount; native cells reset their keyed child when reused. Web keeps a focused row mounted while scrolling and returns focus to the list if that item is removed. Arbitrary native editor focus across offscreen recycling is not promised. Choose rowHeight to fit the actual text/accessibility font size; variable-height rows, paging, drag reorder and automatic scroll restoration across route unmounts are outside this first contract. Give the list its own bounded viewport; avoid placing it inside another vertical scroller. SSR renders the same bounded initial window and hydrates its initial scroll position.',
  },

  'number-input': {
    usage: '<m-number-input v-model="quantity" label="Quantity" :min="1" :max="8" />',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'number | null',
        defaultValue: 'null',
        description: 'Valid number controlled by the app.',
      },
      {
        name: 'draft / v-model:draft',
        type: 'string',
        defaultValue: '—',
        description: 'Optional draft, including incomplete text.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Required visible label.',
      },
      {
        name: 'min / max',
        type: 'number',
        defaultValue: '—',
        description: 'Inclusive bounds.',
      },
      {
        name: 'step',
        type: 'number',
        defaultValue: '1',
        description: 'Positive button and Web arrow-key increment.',
      },
      {
        name: 'locale',
        type: 'en-US | pt-BR',
        defaultValue: 'en-US',
        description: 'Decimal separator; grouping is not accepted.',
      },
      {
        name: 'disabled / readonly',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Blocks editing and stepping.',
      },
    ],
    behavior:
      'Incomplete text stays in the editor without publishing an invalid number. Grouping, exponent notation and currency are not accepted. Uses JavaScript numbers, not a financial decimal type. Public focus() and blur() methods.',
    events: [
      {
        name: 'update:modelValue',
        payload: 'number | null',
        description: 'Component event.',
      },
      {
        name: 'update:draft',
        payload: 'string',
        description: 'Component event.',
      },
      {
        name: 'validityChange',
        payload: 'NumberDraft',
        description: 'Component event.',
      },
    ],
  },
  'multi-select': {
    usage: '<m-multi-select v-model="extras" :options="options" label="Extras" :maxSelected="2" />',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'readonly ChoiceValue[]',
        defaultValue: '[]',
        description: 'Unique values controlled by the app.',
      },
      {
        name: 'options',
        type: 'readonly ChoiceOption[]',
        defaultValue: 'required',
        description: 'Local options with value, label and optional disabled state.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Visible label and Sheet title.',
      },
      {
        name: 'maxSelected',
        type: 'number',
        defaultValue: '—',
        description: 'Positive selection limit.',
      },
      {
        name: 'searchLabel / closeLabel / removeLabel',
        type: 'string',
        defaultValue: '—',
        description: 'Action labels supplied by the app.',
      },
    ],
    behavior:
      'Local search in a Sheet on both renderers. Every selected value must exist in options; filtering keeps selections. Remote pagination and virtualization are outside this control. Update options and selection consistently.',
    events: [
      {
        name: 'update:modelValue',
        payload: 'ChoiceValue[]',
        description: 'Component event.',
      },
    ],
  },
  image: {
    usage: '<m-image src="https://example.com/print.png" alt="Art print" :aspectRatio="4/3" />',
    properties: [
      {
        name: 'src',
        type: 'string',
        defaultValue: 'required',
        description: 'Local image, data URI or URL according to the platform.',
      },
      {
        name: 'alt',
        type: 'string',
        defaultValue: 'required',
        description: 'Description; empty text for a decorative image.',
      },
      {
        name: 'aspectRatio',
        type: 'number',
        defaultValue: '4 / 3',
        description: 'Positive ratio that reserves height.',
      },
      {
        name: 'fit',
        type: 'cover | contain',
        defaultValue: 'cover',
        description: 'Crop or fit the image.',
      },
      {
        name: 'radius',
        type: 'token | number',
        defaultValue: 'md',
        description: 'Theme radius or number.',
      },
      {
        name: 'loadingLabel / errorLabel',
        type: 'string',
        defaultValue: '—',
        description: 'Loading and error copy.',
      },
    ],
    behavior:
      'Reserves space during loading and failure. Obsolete source results are ignored. Uses platform loading, without its own global cache or a network cancellation guarantee.',
    events: [
      {
        name: 'load',
        payload: 'string',
        description: 'Component event.',
      },
      {
        name: 'error',
        payload: 'string',
        description: 'Component event.',
      },
    ],
  },

  'date-picker': {
    usage:
      '<script setup lang="ts">\nimport { ref } from \'vue\'\nimport type { CivilDate, InputHandle } from \'@getcortexlabs/mavis-core\'\nconst date = ref<CivilDate | null>(null)\nconst field = ref<InputHandle>()\n</script>\n\n<template>\n  <MScreen scroll>\n    <MDatePicker ref="field" v-model="date" label="Workshop date"\n      locale="en-US" initialMonth="2026-11"\n      min="2026-11-01" max="2026-12-31"\n      :unavailableDates="[\'2026-11-15\']"\n      helperText="Enter YYYY-MM-DD or choose a calendar day." />\n  </MScreen>\n</template>',
    properties: [
      {
        name: 'dateFormat',
        type: 'iso | locale | yyyy-MM-dd | dd/MM/yyyy | MM/dd/yyyy',
        defaultValue: 'iso',
        description: 'Numeric editor format; model values remain ISO civil dates.',
      },
      {
        name: 'modelValue / v-model',
        type: 'CivilDate | null',
        defaultValue: 'null',
        description: 'Controlled civil date.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Visible editor label and calendar title; cannot be blank.',
      },
      {
        name: 'min / max',
        type: 'CivilDate',
        defaultValue: '—',
        description: 'Inclusive limits. An invalid boundary or min > max throws.',
      },
      {
        name: 'unavailableDates',
        type: 'readonly CivilDate[]',
        defaultValue: '[]',
        description: 'Exact unavailable dates; no callback or implicit weekday rule.',
      },
      {
        name: 'locale',
        type: 'en-US | pt-BR',
        defaultValue: 'en-US',
        description: 'Explicit built-in Gregorian labels and validation text.',
      },
      {
        name: 'initialMonth',
        type: 'YYYY-MM',
        defaultValue: '2000-01',
        description: 'Deterministic empty-calendar snapshot; never inferred from device time.',
      },
      {
        name: 'disabled / readonly',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Block editing, clear and calendar; close an open calendar.',
      },
      {
        name: 'name',
        type: 'string',
        defaultValue: '—',
        description: "Web text field's HTML name; ignored natively.",
      },
      {
        name: 'draft / v-model:draft',
        type: 'string',
        defaultValue: 'omitted',
        description: 'Controlled text independent of the valid model; restores incomplete edits.',
      },
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'CivilDate | null',
        description: 'Requests a valid date.',
      },
      {
        name: 'update:draft',
        payload: 'string',
        description: 'Reports each edit, preserving incomplete and invalid text.',
      },
      {
        name: 'validityChange',
        payload: 'DateValidation',
        description: 'Validity of the current draft.',
      },
    ],
    behavior:
      'Keyboard and calendar share validation. Refs expose focus()/blur(). Values are civil dates, not instants. A controlled draft can restore incomplete text independently of the valid model.',
  },
  'date-range-picker': {
    usage:
      '<script setup lang="ts">\nimport { ref } from \'vue\'\nimport type { DateRange } from \'@getcortexlabs/mavis-core\'\nconst dates = ref<DateRange>({ start: null, end: null })\n</script>\n\n<template>\n  <MDateRangePicker v-model="dates" label="Travel dates" locale="en-US"\n    initialMonth="2026-11" min="2026-11-01" max="2026-12-31"\n    :unavailableDates="[\'2026-11-15\']" />\n</template>',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'DateRange',
        defaultValue: '{ start: null, end: null }',
        description: 'Two CivilDate | null endpoints.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Name of the range.',
      },
      {
        name: 'min / max',
        type: 'CivilDate',
        defaultValue: '—',
        description: 'Inclusive limits.',
      },
      {
        name: 'unavailableDates',
        type: 'readonly CivilDate[]',
        defaultValue: '[]',
        description: 'Also blocks unavailable dates inside the range.',
      },
      {
        name: 'locale',
        type: 'en-US | pt-BR',
        defaultValue: 'en-US',
        description: 'Calendar language.',
      },
      {
        name: 'startName / endName',
        type: 'string',
        defaultValue: '—',
        description: 'Separate Web HTML names; submit each visible draft.',
      },
      {
        name: 'draft / v-model:draft',
        type: 'DateRangeDraft',
        defaultValue: 'omitted',
        description: 'Controlled text independent of the valid model; restores incomplete edits.',
      },
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'DateRange',
        description: 'Requests valid endpoints, including partial ranges.',
      },
      {
        name: 'update:draft',
        payload: 'DateRangeDraft',
        description: 'Text from both editors.',
      },
      {
        name: 'validityChange',
        payload: 'DateValidation',
        description: 'Validity of the entered range.',
      },
    ],
    behavior:
      'Invalid drafts stay editable. The calendar has one focus owner. Dates have no time zone. The draft prop restores both textual endpoints.',
  },
  combobox: {
    usage:
      '<script setup lang="ts">\nimport { ref } from \'vue\'\nimport type { ChoiceOption, ChoiceValue, ComboboxSearch } from \'@getcortexlabs/mavis-core\'\n\nconst municipality = ref<ChoiceValue | null>(2611606)\nconst query = ref(\'Recife\')\nconst selected = ref<ChoiceOption | null>({ value: 2611606, label: \'Recife\' })\n// The application supplies its own service. Keep credentials and services out of SSR payloads.\nconst search: ComboboxSearch = async (query, { limit, onCancel }) => {\n  const controller = new AbortController()\n  onCancel(() => controller.abort())\n  const response = await fetch(\n    `/api/municipalities?q=${encodeURIComponent(query)}&limit=${limit}`,\n    {\n      signal: controller.signal,\n    },\n  )\n  if (!response.ok) throw new Error(\'Search failed\')\n  return response.json() // Validate your service\'s response before returning ChoiceOption[].\n}\n</script>\n\n<template>\n  <m-combobox\n    v-model="municipality"\n    v-model:query="query"\n    :selectedOption="selected"\n    :search="search"\n    :initialResults="{ query: \'Recife\', options: [{ value: 2611606, label: \'Recife\' }] }"\n    label="Municipality"\n    @select="selected = $event"\n  />\n</template>',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'ChoiceValue | null',
        defaultValue: 'null',
        description: 'Confirmed choice; typing does not select.',
      },
      {
        name: 'query / v-model:query',
        type: 'string',
        defaultValue: 'required',
        description: 'Controlled search text.',
      },
      {
        name: 'search',
        type: 'ComboboxSearch',
        defaultValue: 'required',
        description: 'Application search service with cancellation.',
      },
      {
        name: 'selectedOption',
        type: 'ChoiceOption | null',
        defaultValue: 'null',
        description: 'Label for a selection outside the current results.',
      },
      {
        name: 'initialResults',
        type: 'ComboboxSnapshot',
        defaultValue: '—',
        description: 'Initial SSR snapshot.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Visible name.',
      },
      {
        name: 'debounce',
        type: 'number',
        defaultValue: '200',
        description: 'Delay before searching, in milliseconds.',
      },
      {
        name: 'maxResults',
        type: 'number',
        defaultValue: '50',
        description: 'Limit from 1 to 100 results.',
      },
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'ChoiceValue | null',
        description: 'Requests selection or clearing.',
      },
      {
        name: 'update:query',
        payload: 'string',
        description: 'Requests an editor change.',
      },
      {
        name: 'select',
        payload: 'ChoiceOption | null',
        description: 'Snapshot of the requested option.',
      },
    ],
    behavior:
      'Stale results are ignored; focus and IME stay in the editor. Supports one selection and one page of results.',
  },
  'file-picker': {
    usage:
      '<script setup lang="ts">\nimport { useFileSelection } from \'@getcortexlabs/mavis-core/vue\'\n\nconst selection = useFileSelection({\n  multiple: true,\n  accept: [\'image/*\', \'.pdf\'],\n  maxCount: 3,\n  maxSize: 5 * 1024 * 1024,\n})\n</script>\n\n<template>\n  <m-file-picker :selection="selection" label="Trip documents" />\n</template>',
    properties: [
      {
        name: 'selection',
        type: 'FileSelectionController',
        defaultValue: 'required',
        description: 'Required FileSelectionController.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Required nonempty visible/accessibility label.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Blocks actions and pauses active work; defaults to false.',
      },
      {
        name: 'chooseLabel / uploadLabel / cancelLabel / retryLabel / removeLabel',
        type: 'string',
        defaultValue: 'inglês',
        description:
          'Translate action text; defaults are English. File action names include the filename.',
      },
      {
        name: 'statusLabels / errorLabels',
        type: 'partial record',
        defaultValue: '{}',
        description: 'Optional mapping for all five status names.',
      },
    ],
    behavior:
      'Uses each platform’s file picker. Upload belongs to the application, with no built-in endpoint. Descriptors are serializable; file handles and temporary URLs are not.',
  },
  'form-group': {
    usage:
      '<m-form-group label="Seus dados" description="Vamos manter contato.">\n  <m-input v-model="name" label="Nome" />\n</m-form-group>',
    properties: [
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Nonempty visible heading.',
      },
      {
        name: 'description',
        type: 'string',
        defaultValue: "''",
        description: 'Optional explanation for the group.',
      },
      {
        name: 'id',
        type: 'string',
        defaultValue: 'gerado',
        description: 'Stable group identity; Web connects heading and description.',
      },
    ],
    behavior:
      'Groups fields. The application owns values, rules and submission. Does not create an HTML form or intercept Enter.',
  },
  'form-errors': {
    usage: '<m-form-errors :form="form" title="Revise seus dados" />',
    properties: [
      {
        name: 'form',
        type: 'FormController',
        defaultValue: 'required',
        description: 'Request/component-owned controller.',
      },
      {
        name: 'title',
        type: 'string',
        defaultValue: 'Review these fields',
        description: 'Visible summary heading.',
      },
      {
        name: 'announce',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Opt-in Web alert role; otherwise a named region.',
      },
    ],
    events: [
      {
        name: 'focus',
        payload: 'field, focused',
        description: 'Outcome of activating an error.',
      },
    ],
    behavior:
      'Errors navigate to public field handles, optionally revealing the field first. The application owns cancellable validation and form values.',
  },
  steps: {
    usage: '<m-steps v-model="step" :steps="steps" label="Etapas do cadastro" />',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'ChoiceValue | null',
        defaultValue: 'null',
        description: 'Current step; no automatic selection.',
      },
      {
        name: 'steps',
        type: 'readonly StepOption[]',
        defaultValue: 'required',
        description: 'Nonempty ordered steps.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Navigation name.',
      },
      {
        name: 'loading / disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Prevents step requests.',
      },
      {
        name: 'currentLabel / completeLabel / errorLabel',
        type: 'string',
        defaultValue: 'Current / Complete / Needs attention',
        description: 'Localized state labels.',
      },
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'ChoiceValue',
        description: 'Requests another enabled step.',
      },
    ],
    behavior:
      'The application owns validation and panels. The recipe uses KeepAlive for visited editors and reveals the step before focusing an error.',
  },
  pagination: {
    usage:
      '<m-pagination v-model="page" :total="total" :pageSize="20" label="Páginas de resultados" />',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'number',
        defaultValue: '1',
        description: 'One-based requested page.',
      },
      {
        name: 'total',
        type: 'number',
        defaultValue: 'required',
        description: 'Nonnegative safe-integer result count.',
      },
      {
        name: 'pageSize',
        type: 'number',
        defaultValue: '20',
        description: 'Positive safe-integer page size.',
      },
      {
        name: 'siblingCount',
        type: '0 | 1 | 2',
        defaultValue: '1',
        description: 'Neighbor pages around the current page.',
      },
      {
        name: 'statusText',
        type: 'string',
        defaultValue: "''",
        description: 'Application-defined results announcement.',
      },
      {
        name: 'loading / disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Prevents page requests.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'Result pages',
        description: 'Navigation name.',
      },
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'number',
        description: 'Requests a different valid page.',
      },
    ],
    behavior:
      'The parent owns results and recovery when filtering makes the current page invalid. The recipe cancels stale requests and returns to the first page.',
  },
  chip: {
    usage:
      '<script setup lang="ts">\nimport { ref } from \'vue\'\nconst design = ref(true)\nconst tags = ref([\'Vue\', \'NativeScript\'])\n</script>\n\n<template>\n  <m-chip v-model="design" selectable label="Design" icon="palette" />\n  <m-row gap="sm" wrap>\n    <m-chip v-for="tag in tags" :key="tag" :label="tag" removable\n      :removeLabel="`Remove ${tag}`" @remove="tags = tags.filter(value => value !== tag)" />\n  </m-row>\n</template>',
    properties: [
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Nonempty visible text and selection action name.',
      },
      {
        name: 'icon',
        type: 'IconName',
        defaultValue: '—',
        description: 'Decorative icon; a check replaces it when selected.',
      },
      {
        name: 'selectable / modelValue',
        type: 'boolean / boolean',
        defaultValue: 'false / false',
        description: 'Makes the label a toggle button.',
      },
      {
        name: 'removable / removeLabel',
        type: 'boolean / string',
        defaultValue: 'false / —',
        description: 'Adds a separate removal button.',
      },
      {
        name: 'tone',
        type: 'primary | accent',
        defaultValue: 'primary',
        description: 'Selection and focus color.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Blocks both actions, preserving supplied selection.',
      },
      {
        name: 'width / grow / shrink',
        type: 'dimensão / number / number',
        defaultValue: 'auto / 0 / context',
        description: 'Layout participation.',
      },
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'boolean',
        description: 'Requests a selection change. The parent accepts or rejects it.',
      },
      {
        name: 'remove',
        payload: '—',
        description: 'Requests removal without changing selection or removing itself.',
      },
    ],
    behavior:
      'Selection and removal are sibling targets. Use a wrapping Row for collections. On Web, Tab reaches each action and Enter/Space activate it. The app owns collection updates and focus after removal. Press uses Jolt natively and CSS on Web, respecting reduced motion.',
  },
  'empty-state': {
    usage:
      '<m-empty-state title="Nothing saved yet."\n  description="Keep a reading for later." icon="bookmark" tone="accent">\n  <template #actions>\n    <m-button @click="explore">Explore readings</m-button>\n  </template>\n</m-empty-state>',
    properties: [
      {
        name: 'title',
        type: 'string',
        defaultValue: 'required',
        description: 'Nonempty heading; blank/missing throws TypeError.',
      },
      {
        name: 'description',
        type: 'string',
        defaultValue: 'vazio',
        description: 'Optional guidance below the title.',
      },
      {
        name: 'icon',
        type: 'IconName',
        defaultValue: 'inbox',
        description: 'Default illustration symbol.',
      },
      {
        name: 'tone',
        type: 'primary | accent',
        defaultValue: 'primary',
        description: 'Illustration palette.',
      },
      {
        name: 'compact',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Smaller illustration, heading and spacing.',
      },
      {
        name: 'titleAs',
        type: 'h1 | h2 | h3 | h4 | h5 | h6',
        defaultValue: 'h2',
        description: 'Web heading level; native remains a header.',
      },
      {
        name: 'width / grow / shrink',
        type: 'dimensão / number / number',
        defaultValue: 'auto / 0 / context',
        description: 'Layout participation.',
      },
    ],
    behavior:
      'The illustration slot replaces the decorative artwork; put actions in the actions slot. The app decides when to show, fetch or recover. Does not automatically focus, announce or animate. No own events.',
  },
  accordion: {
    usage:
      '<script setup lang="ts">\nimport { ref } from \'vue\'\nimport type { ChoiceValue } from \'@getcortexlabs/mavis-core\'\nconst expanded = ref<ChoiceValue[]>([])\nconst items = [{ value: \'delivery\', title: \'When will it arrive?\', icon: \'package\' }] as const\n</script>\n\n<template>\n  <m-accordion v-model="expanded" :items="items" label="Delivery questions">\n    <template #default="{ item }">\n      <m-text v-if="item.value === \'delivery\'">Check the date in your order.</m-text>\n    </template>\n  </m-accordion>\n</template>',
    properties: [
      {
        name: 'items',
        type: 'readonly AccordionItem[]',
        defaultValue: 'required',
        description: 'Unique value, nonempty title, optional description, icon and disabled.',
      },
      {
        name: 'modelValue',
        type: 'readonly ChoiceValue[]',
        defaultValue: '[]',
        description: 'Expanded values; always an array.',
      },
      {
        name: 'multiple',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Allows more than one open section.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Nonempty accessible group name.',
      },
      {
        name: 'expandedLabel / collapsedLabel',
        type: 'string',
        defaultValue: 'Expanded / Collapsed',
        description: 'Nonempty native state descriptions; translate in the app.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Disables all headers. Body controls remain app-owned.',
      },
      {
        name: 'width / grow / shrink',
        type: 'dimensão / number / number',
        defaultValue: 'auto / 0 / context',
        description: 'Layout participation.',
      },
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'ChoiceValue[]',
        description: 'Requests the next open-value array without mutating the supplied array.',
      },
    ],
    behavior:
      'The default slot receives { item }. Content mounts when opened and unmounts after Reveal closes; keep persistent data in the parent. Reveal animates intrinsic height. In single mode, multiple open values throw RangeError. Missing values do not open a panel or change the model. On Web, Up/Down and Home/End move header focus; Enter/Space toggle sections.',
  },
  'segmented-control': {
    usage:
      "<m-segmented-control v-model=\"period\" label=\"Focus period\" :options=\"[\n  { value: 'day', label: 'Day' },\n  { value: 'week', label: 'Week' },\n  { value: 'month', label: 'Month' }\n]\" />",
    properties: [
      {
        name: 'options',
        type: 'readonly SegmentedOption[]',
        defaultValue: 'required',
        description: 'Unique value, nonempty label, optional disabled.',
      },
      {
        name: 'modelValue',
        type: 'ChoiceValue | null',
        defaultValue: 'null',
        description: 'Selected string or finite number.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Nonempty accessible group name; no automatic visible label.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Disables the group.',
      },
      {
        name: 'width / grow / shrink',
        type: 'dimensão / number / number',
        defaultValue: 'auto / 0 / context',
        description: 'Layout participation.',
      },
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'ChoiceValue',
        description: 'Requests a different enabled option.',
      },
    ],
    behavior:
      'Equal-width segments, naturally wrapping labels and an indicator animated with Jolt natively/CSS on Web. Prefer 2–4 short options. The app owns the value and related content; no panels or navigation are built in. On Web, Tab enters once; arrows/Home/End focus and request selection, skipping disabled options. Respects reduced motion.',
  },
  'list-item': {
    usage:
      '<m-list-item title="Marina Costa" description="Design · São Paulo" interactive\n  accessibilityLabel="Open Marina Costa, Design, available" @click="openMember">\n  <template #leading><m-avatar name="Marina Costa" :accessibilityHidden="true" /></template>\n  <template #trailing><m-badge text="Available" tone="success" size="sm" /></template>\n</m-list-item>',
    properties: [
      {
        name: 'title',
        type: 'string',
        defaultValue: 'required',
        description: 'Non-empty title; wraps.',
      },
      {
        name: 'description',
        type: 'string',
        defaultValue: "''",
        description: 'Secondary text, also wraps.',
      },
      {
        name: 'interactive',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Turns the surface into one action.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: "Blocks only the interactive row's action.",
      },
      {
        name: 'width / grow / shrink',
        type: 'dimension / number / number',
        defaultValue: 'auto / 0 / context',
        description: 'Width following the layout contract.',
      },
      {
        name: 'accessibilityLabel',
        type: 'string',
        defaultValue: 'título + descrição',
        description: 'Interactive row name. Include meaningful slot content.',
      },
      {
        name: 'accessibilityHidden',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Hides redundant content.',
      },
      {
        name: 'id',
        type: 'string',
        defaultValue: '—',
        description: 'Optional identifier.',
      },
    ],
    events: [
      {
        name: 'click',
        payload: 'none',
        description: 'An enabled interactive row was activated.',
      },
    ],
    behavior:
      'Leading/trailing slots hold compact content; no default slot. An interactive row without trailing content shows an arrow; do not nest controls in that mode. Informational rows preserve children and allow independent buttons. Natural height, themed surface, md padding/radius, no border. No virtualization, selection or built-in navigation.',
  },
  separator: {
    usage:
      '<m-column>\n  <m-list-item title="Design" description="Ideas taking shape." />\n  <m-separator inset="md" />\n  <m-list-item title="Engineering" description="Experiences that work." />\n</m-column>\n\n<m-row>\n  <m-text>12 projects</m-text>\n  <m-separator orientation="vertical" :length="32" spacing="md" />\n  <m-text>4 people</m-text>\n</m-row>',
    properties: [
      {
        name: 'orientation',
        type: 'horizontal | vertical',
        defaultValue: 'horizontal',
        description: 'Line direction.',
      },
      {
        name: 'length',
        type: 'number',
        defaultValue: 'automático',
        description: 'Explicit line length in DIP/px, excluding margins.',
      },
      {
        name: 'spacing',
        type: 'token | number',
        defaultValue: 'none',
        description: 'Margin on each side, perpendicular to the line.',
      },
      {
        name: 'inset',
        type: 'token | number',
        defaultValue: 'none',
        description: 'Inset at each end of the line.',
      },
      {
        name: 'id',
        type: 'string',
        defaultValue: '—',
        description: 'Optional identifier.',
      },
    ],
    behavior:
      'Decorative 1 DIP/px border-colored line, without content, focus, events or grouping semantics. Sizes automatically in a nonwrapping Column (horizontal) or Row (vertical); elsewhere, supply length. Explicit lengths are centered. Negative and nonfinite values are rejected.',
  },
  avatar: {
    usage:
      '<m-avatar :src="person.image" :name="person.name" size="lg" />\n<m-avatar name="Mavis Studio" shape="square" />\n<m-avatar accessibilityLabel="Guest" />',
    properties: [
      {
        name: 'src',
        type: 'string',
        defaultValue: "''",
        description: 'Image source. Missing or failed sources keep the fallback.',
      },
      {
        name: 'name',
        type: 'string',
        defaultValue: "''",
        description: 'Name for initials and the default accessible name.',
      },
      {
        name: 'size',
        type: 'sm | md | lg | xl',
        defaultValue: 'md',
        description: '32, 48, 64 or 96 DIP/px.',
      },
      {
        name: 'shape',
        type: 'circle | square',
        defaultValue: 'circle',
        description: 'Circle or square with rounded corners.',
      },
      {
        name: 'accessibilityLabel',
        type: 'string',
        defaultValue: 'name',
        description: 'Overrides the announced name.',
      },
      {
        name: 'accessibilityHidden',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Hides the avatar when nearby text already identifies it.',
      },
      {
        name: 'id',
        type: 'string',
        defaultValue: '—',
        description: 'Optional identifier.',
      },
    ],
    behavior:
      'Center-cropped image, initials while loading/on error, and an icon without a name. Changing src restores fallback and ignores stale results. No upload, action or automatic retry. Visual dimensions stay fixed; provide an adjacent name for scalable text.',
  },
  badge: {
    usage:
      '<m-badge text="Published" tone="success" />\n<m-badge :text="0" tone="accent" accessibilityLabel="0 unread messages" />\n<m-badge text="99+" size="sm" accessibilityLabel="More than 99 messages" />',
    properties: [
      {
        name: 'text',
        type: 'string | number',
        defaultValue: 'required',
        description: 'Content; zero is displayed.',
      },
      {
        name: 'tone',
        type: 'neutral | primary | accent | success | warning | danger',
        defaultValue: 'neutral',
        description: 'Theme colors.',
      },
      {
        name: 'size',
        type: 'sm | md',
        defaultValue: 'md',
        description: 'Text and spacing scale.',
      },
      {
        name: 'accessibilityLabel',
        type: 'string',
        defaultValue: '—',
        description: 'Describes the count in context when needed.',
      },
      {
        name: 'accessibilityHidden',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Hides redundant information.',
      },
      {
        name: 'id',
        type: 'string',
        defaultValue: '—',
        description: 'Optional identifier.',
      },
    ],
    behavior:
      'Information without actions, focus, slots or automatic announcements. The app owns values, translations and formatting such as 99+. Long text wraps; use a wrapping Row for groups. Do not convey meaning through color alone.',
  },
  progress: {
    usage:
      '<m-progress :value="64" label="Collection download" tone="accent" />\n<m-progress indeterminate label="Preparing collection" indeterminateLabel="Preparing" />',
    properties: [
      {
        name: 'value / max',
        type: 'number',
        defaultValue: '0 / 100',
        description: 'Finite value, clamped between zero and max.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Nonempty accessible name; does not render visible text.',
      },
      {
        name: 'indeterminate',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Shows a moving segment instead of a known percentage.',
      },
      {
        name: 'indeterminateLabel',
        type: 'string',
        defaultValue: 'Loading',
        description:
          'Nonempty accessible description for indeterminate work; translate in the app.',
      },
      {
        name: 'size',
        type: 'sm | md | lg',
        defaultValue: 'md',
        description: 'Track heights of 4, 8 and 12 DIP/px.',
      },
      {
        name: 'tone',
        type: 'primary | accent | success | warning | danger',
        defaultValue: 'primary',
        description: 'Themed fill color.',
      },
      {
        name: 'width / grow / shrink',
        type: 'dimension / number / number',
        defaultValue: 'auto / 0 / context',
        description: 'Layout participation, as in Box.',
      },
      {
        name: 'id / accessibilityHidden',
        type: 'string / boolean',
        defaultValue: '— / false',
        description: 'Optional identifier and accessibility exclusion.',
      },
    ],
    behavior:
      'Linear indicator without slots or events. The app supplies value, message and task state. Known values update directly; the indeterminate segment uses Jolt natively and CSS on Web. Reduced motion leaves it centered. Pauses in the background and releases animation/listeners on unload/unmount.',
  },
  alert: {
    usage:
      '<m-alert\n  v-if="visible"\n  title="Download failed"\n  description="Check your connection and try again."\n  tone="error"\n  dismissible\n  closeLabel="Dismiss download notice"\n  @close="visible = false"\n>\n  <template #actions><m-button @click="retry">Try again</m-button></template>\n</m-alert>',
    properties: [
      {
        name: 'title',
        type: 'string',
        defaultValue: 'required',
        description: 'Nonempty message title.',
      },
      {
        name: 'description',
        type: 'string',
        defaultValue: "''",
        description: 'Optional supporting text.',
      },
      {
        name: 'tone',
        type: 'info | success | warning | error',
        defaultValue: 'info',
        description: 'Semantic icon and border color.',
      },
      {
        name: 'dismissible',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Shows the close button.',
      },
      {
        name: 'closeLabel',
        type: 'string',
        defaultValue: 'Dismiss message',
        description:
          'Accessible close-button name; translate in the app. Must be nonempty when dismissible.',
      },
      {
        name: 'announce',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Opts into announcements for dynamic messages, without moving focus.',
      },
      {
        name: 'width / grow / shrink',
        type: 'dimension / number / number',
        defaultValue: 'auto / 0 / context',
        description: 'Layout participation, as in Column.',
      },
      {
        name: 'id / accessibilityHidden',
        type: 'string / boolean',
        defaultValue: '— / false',
        description: 'Optional identifier and accessibility exclusion.',
      },
    ],
    events: [
      {
        name: 'close',
        payload: '—',
        description: 'Requests dismissal. Remove the notice with v-if or application state.',
      },
    ],
    behavior:
      'Persistent in-flow notice, without a timer, queue, overlay or focus capture. Use actions for independent buttons; there is no default slot. Native title and description are read together. announce creates a Web status/alert region and requests a native announcement when loaded; speech depends on the screen reader.',
  },
  skeleton: {
    usage:
      '<template>\n  <m-column v-if="loading" gap="md">\n    <m-text>Loading profile…</m-text>\n    <m-row gap="md">\n      <m-skeleton :width="48" :height="48" radius="full" :shrink="0" />\n      <m-column :width="0" :grow="1" gap="sm">\n        <m-skeleton width="70%" />\n        <m-skeleton width="45%" :height="12" />\n      </m-column>\n    </m-row>\n  </m-column>\n  <m-text v-else>{{ profile.name }}</m-text>\n</template>',
    properties: [
      {
        name: 'width',
        type: 'number | % | auto',
        defaultValue: 'auto',
        description: 'Fills the available width in Column.',
      },
      {
        name: 'height',
        type: 'number | % | auto',
        defaultValue: '16',
        description: 'Block height.',
      },
      {
        name: 'radius',
        type: 'token | number',
        defaultValue: 'sm',
        description: 'Corner radius; full with equal dimensions produces a circle.',
      },
      {
        name: 'animated',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Enables the pulse when system motion preferences allow it.',
      },
      {
        name: 'grow / shrink',
        type: 'number',
        defaultValue: '0 / context',
        description: 'Layout participation, as in Box.',
      },
      {
        name: 'id',
        type: 'string',
        defaultValue: '—',
        description: 'Optional identifier.',
      },
    ],
    behavior:
      'Decorative block without focus, events or content. The app owns loading, data and status messages. Uses theme border color; Jolt natively and CSS on Web. Pauses in the background and releases on unload/unmount. Remove placeholders when results arrive.',
  },
  tabs: {
    usage:
      "<script setup lang=\"ts\">\nimport { ref } from 'vue'\nimport type { ChoiceValue, TabOption } from '@getcortexlabs/mavis-core'\n\nconst active = ref<ChoiceValue | null>('profile')\nconst tabs: TabOption[] = [\n  { value: 'profile', label: 'Profile' },\n  { value: 'activity', label: 'Activity' },\n  { value: 'upcoming', label: 'Coming soon', disabled: true },\n]\n</script>\n\n<template>\n  <m-tabs v-model=\"active\" :tabs=\"tabs\" label=\"Your space\">\n    <template #default=\"{ value }\">\n      <m-column v-if=\"value === 'profile'\" gap=\"md\">\n        <m-text variant=\"heading\">About you</m-text>\n        <m-text>Your profile content.</m-text>\n      </m-column>\n      <m-text v-else>Recent activity.</m-text>\n    </template>\n  </m-tabs>\n</template>",
    properties: [
      {
        name: 'modelValue',
        type: 'string | number | null',
        defaultValue: 'null',
        description: 'Controlled selection. Use v-model and choose the initial value in the app.',
      },
      {
        name: 'tabs',
        type: 'readonly TabOption[]',
        defaultValue: 'required',
        description: 'Ordered list of tabs.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Nonempty group name used by assistive technology.',
      },
      {
        name: 'keepAlive',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Retains visited panels until their tab is removed.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Prevents user activation; the parent can still change selection.',
      },
      {
        name: 'id',
        type: 'string',
        defaultValue: 'omitido',
        description: 'Container identifier.',
      },
      {
        name: 'width / grow / shrink',
        type: 'Dimension / number',
        defaultValue: 'auto / 0 / context',
        description: 'Container width, not individual tab width.',
      },
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'string | number',
        description: 'A different enabled activation requests a change; the parent may reject it.',
      },
    ],
    behavior:
      'The default slot receives { value }. Switching tabs normally unmounts the previous panel. keepAlive preserves visited instances and deactivates inactive ones. Store persistent data in the app. Null/missing values leave no panel and do not choose another tab. Horizontally scrollable bar, Jolt native/CSS Web indicator. Web arrows/Home/End move focus; Enter/Space activate. Does not change routes or swipe between panels.',
  },
  dialog: {
    usage:
      '<script setup lang="ts">\nimport { ref } from \'vue\'\nconst open = ref(false)\nconst loading = ref(false)\nconst error = ref(\'\')\nasync function confirm() {\n  loading.value = true\n  error.value = \'\'\n  try {\n    await saveChanges() // Your application\'s operation.\n    open.value = false\n  } catch {\n    error.value = \'Could not save. Please try again.\'\n  } finally {\n    loading.value = false\n  }\n}\n</script>\n<template>\n  <m-screen>\n    <m-button @click="open = true">Save changes</m-button>\n    <m-dialog v-model:open="open" title="Save changes?"\n      :description="error || \'Your profile will be updated.\'"\n      :loading="loading" confirmLabel="Save" cancelLabel="Keep editing"\n      loadingLabel="Saving…" @confirm="confirm" />\n  </m-screen>\n</template>',
    properties: [
      {
        name: 'open',
        type: 'boolean',
        defaultValue: 'false',
        description: 'v-model:open.',
      },
      {
        name: 'title',
        type: 'string',
        defaultValue: 'required',
        description: 'Nonempty title and accessible name.',
      },
      {
        name: 'description',
        type: 'string',
        defaultValue: 'omitido',
        description: 'Optional plain text. HTML is not interpreted.',
      },
      {
        name: 'tone',
        type: 'default | danger',
        defaultValue: 'default',
        description: 'Icon and confirmation emphasis.',
      },
      {
        name: 'confirmLabel / cancelLabel',
        type: 'string',
        defaultValue: 'Continue / Cancel',
        description: 'Primary action; nonempty.',
      },
      {
        name: 'loading',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Blocks actions, backdrop, Escape and back.',
      },
      {
        name: 'loadingLabel',
        type: 'string',
        defaultValue: 'Working…',
        description: 'Confirmation label while processing; nonempty.',
      },
      {
        name: 'dismissible',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Allows backdrop, Escape and back. Cancel remains available.',
      },
      {
        name: 'id',
        type: 'string',
        defaultValue: 'omitido',
        description: 'Modal surface identifier.',
      },
    ],
    events: [
      {
        name: 'confirm',
        payload: 'none',
        description: 'Requests the action. The app decides when to close.',
      },
      {
        name: 'update:open',
        payload: 'false',
        description: 'Requests closing through cancellation or navigation.',
      },
      {
        name: 'close',
        payload: 'DialogCloseReason',
        description:
          'cancel, backdrop, escape, back, program or navigation; emitted before the exit finishes.',
      },
    ],
    behavior:
      'Declare inside MScreen natively. One decision at a time, no slots or nested modals. Confirmation does not close automatically; loading supports processing and retry after errors. Web contains/restores focus; Android handles Back. Navigation releases the layer, backgrounding preserves state, and Toast waits for the modal. Long text scrolls inside the surface.',
  },
  toast: {
    usage:
      '<script setup lang="ts">\nimport { useToast } from \'@getcortexlabs/mavis-core/vue\'\n\nconst toast = useToast()\nfunction saved() {\n  toast.show({\n    title: \'Profile saved\',\n    message: \'Your changes are ready.\',\n    tone: \'success\',\n  })\n}\n</script>\n\n<template>\n  <m-screen>\n    <m-button @click="saved">Save</m-button>\n    <m-toast :controller="toast" closeLabel="Dismiss notice" />\n  </m-screen>\n</template>',
    properties: [
      {
        name: "useToast({ scope: 'app' })",
        type: 'ToastController',
        defaultValue: 'local',
        description:
          'App-owned queue, automatically hosted by the active Screen. Preserves order/time between routes and waits during modals.',
      },
      {
        name: 'controller',
        type: 'ToastController',
        defaultValue: 'required',
        description: 'The queue returned by useToast(). One host per local controller.',
      },
      {
        name: 'closeLabel',
        type: 'string',
        defaultValue: 'Dismiss notification',
        description: 'Accessible name for the close button. Translate it in the app.',
      },
      {
        name: 'show({ message, title?, tone?, duration? })',
        type: 'método do controller',
        defaultValue: '—',
        description: 'Queues a message and returns its ID. message is required; title is optional.',
      },
      {
        name: 'tone',
        type: 'success | error | warning | info',
        defaultValue: 'info',
        description: 'Semantic icon and color. The warning color comes from theme.colors.warning.',
      },
      {
        name: 'duration',
        type: 'number',
        defaultValue: '5000',
        description:
          'Milliseconds after entry completes; 0 keeps the notice until dismissed. Must be finite and between 0 and 2147483647.',
      },
      {
        name: 'dismiss(id?) / clear()',
        type: 'métodos do controller',
        defaultValue: '—',
        description:
          'Dismisses the current message or an ID; clear also discards pending messages.',
      },
    ],
    behavior:
      'One notice at a time, at the top, without blocking or stealing focus. Local scope clears on page exit; app scope preserves the queue between routes. Modals defer presentation and pause time. Web also pauses on hover/focus and when the tab is hidden. No actions or swipe.',
  },
  select: {
    usage:
      '<script setup lang="ts">\nimport { ref } from \'vue\'\nimport type { ChoiceOption, ChoiceValue } from \'@getcortexlabs/mavis-core\'\n\nconst interest = ref<ChoiceValue | null>(null)\nconst options: ChoiceOption[] = [\n  { value: \'design\', label: \'Design\', helperText: \'Ideas taking shape.\' },\n  { value: \'photo\', label: \'Photography\' },\n  { value: \'film\', label: \'Film\', disabled: true },\n]\n</script>\n\n<template>\n  <MScreen scroll>\n    <MColumn padding="lg" gap="md">\n      <MSelect v-model="interest" :options="options" label="Your world"\n        placeholder="Choose an interest" />\n      <MButton variant="ghost" @click="interest = null">Clear selection</MButton>\n    </MColumn>\n  </MScreen>\n</template>',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'string | number | null',
        defaultValue: 'null',
        description: 'Controlled value. Null means no choice.',
      },
      {
        name: 'options',
        type: 'readonly ChoiceOption[]',
        defaultValue: 'required',
        description:
          'The Radio choice contract: stable string/finite-number values, labels and optional helperText/disabled.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Visible field label and list title.',
      },
      {
        name: 'placeholder',
        type: 'string',
        defaultValue: 'Select an option',
        description: 'Field text when no option matches the value.',
      },
      {
        name: 'helperText / error',
        type: 'string',
        defaultValue: "''",
        description: 'Explanation below the field.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Blocks opening; closes an open list without changing the value.',
      },
      {
        name: 'closeLabel',
        type: 'string',
        defaultValue: 'Close',
        description: "Accessible name of the list's close button.",
      },
      {
        name: 'emptyText',
        type: 'string',
        defaultValue: 'No options available',
        description: 'Message inside an empty list.',
      },
      {
        name: 'width / grow / shrink',
        type: 'dimension / number',
        defaultValue: 'auto / 0 / context',
        description: 'Field size and space distribution.',
      },
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'string | number',
        description:
          'One request for a different enabled choice. Opening, cancelling, repeating and external clearing do not emit.',
      },
    ],
    behavior:
      'Selection immediately closes the list; the parent keeps the final decision. Clear by assigning null. Live options never choose a replacement when removed, and disabled options cannot activate. Web uses a dialog/listbox with arrows, Home/End, typeahead, Enter/Space, Escape and focus return. Natively, declare in MScreen and integrate claimSystemBack with the router, as for Sheet. Local list without search or virtualization.',
  },
  radio: {
    usage:
      "<script setup lang=\"ts\">\nimport { ref } from 'vue'\nimport type { ChoiceOption, ChoiceValue } from '@getcortexlabs/mavis-core'\n\nconst rhythm = ref<ChoiceValue | null>(null)\nconst options: ChoiceOption[] = [\n  { value: 'weekly', label: 'Take it slow', helperText: 'A weekly digest.' },\n  { value: 'daily', label: 'A little every day' },\n  { value: 'live', label: 'As it happens', disabled: true },\n]\n</script>\n\n<template>\n  <MRadioGroup v-model=\"rhythm\" :options=\"options\" label=\"Reading rhythm\" />\n</template>",
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'string | number | null',
        defaultValue: 'null',
        description: 'Controlled selection; null means no choice.',
      },
      {
        name: 'options',
        type: 'readonly ChoiceOption[]',
        defaultValue: 'required',
        description: 'Ordered list of uniquely identified options.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Visible group label.',
      },
      {
        name: 'helperText',
        type: 'string',
        defaultValue: "''",
        description: 'Optional explanation below the group label.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Disables every option without changing the value.',
      },
      {
        name: 'width / grow / shrink',
        type: 'dimension / number',
        defaultValue: 'auto / 0 / context',
        description: 'Group size and space distribution.',
      },
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'string | number',
        description: 'Requests a different enabled option. Does not emit null or repeat selection.',
      },
    ],
    behavior:
      'The app owns the value. Removing the selected option leaves all unselected; disabling it preserves selection. Neither emits nor chooses a replacement. On Web, Tab enters once; arrows traverse enabled options, Home/End reach first/last, and Space selects. Arrays, validation and submission belong to the app.',
  },
  checkbox: {
    usage:
      '<script setup lang="ts">\nimport { ref } from \'vue\'\nconst selected = ref(false)\nconst mixed = ref(true)\n</script>\n\n<template>\n  <MCheckbox\n    v-model="selected"\n    v-model:indeterminate="mixed"\n    label="All topics"\n    helperText="Choose what appears in your collection."\n  />\n</template>',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Controlled checked value.',
      },
      {
        name: 'indeterminate',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Controlled partial-selection display; takes precedence over checked.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Visible label and accessible name.',
      },
      {
        name: 'helperText',
        type: 'string',
        defaultValue: "''",
        description: 'Optional supporting text.',
      },
      {
        name: 'indeterminateLabel',
        type: 'string',
        defaultValue: 'Partially selected',
        description: 'Accessible description of the mixed state. Translate with the label.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Prevents activation from the whole row and keyboard.',
      },
      {
        name: 'width / grow / shrink',
        type: 'dimension / number',
        defaultValue: 'auto / 0 / context',
        description: 'Width of the full row.',
      },
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'boolean',
        description:
          'One proposal per activation. Partial state requests true; otherwise it toggles.',
      },
      {
        name: 'update:indeterminate',
        payload: 'false',
        description: 'Requests clearing the partial state before emitting the new checked value.',
      },
    ],
    behavior:
      'The whole row activates the control. The app accepts events or retains previous values. External changes do not emit. Arrays, select-all and validation belong to the app. Web Space toggles; the native surface uses checkbox semantics and Jolt feedback on the mark.',
  },
  switch: {
    usage:
      '<script setup lang="ts">\nimport { ref } from \'vue\'\nconst notifications = ref(true)\n</script>\n\n<template>\n  <MSwitch\n    v-model="notifications"\n    label="Notifications"\n    helperText="Updates from the people you follow."\n  />\n</template>',
    properties: [
      {
        name: 'modelValue / v-model',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Controlled on/off value.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Visible label and accessible name.',
      },
      {
        name: 'helperText',
        type: 'string',
        defaultValue: "''",
        description: 'Optional explanation below the label.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Prevents activation from the label and control.',
      },
      {
        name: 'width',
        type: 'number | auto | %',
        defaultValue: 'auto',
        description: 'Width of the complete row.',
      },
      {
        name: 'grow / shrink',
        type: 'number',
        defaultValue: '0 / context',
        description: 'Space distribution in the parent layout.',
      },
    ],
    events: [
      {
        name: 'update:modelValue',
        payload: 'boolean',
        description: 'One change per activation; external changes do not emit.',
      },
    ],
    behavior:
      'Tap the label or control. Web Space/Enter toggle. The app accepts by updating v-model; otherwise the previous value remains. The native switch retains system gestures/animation, with Jolt feedback on the label. Do not put links or other controls inside the label.',
  },
  input: {
    usage:
      '<script setup lang="ts">\nimport { ref } from \'vue\'\nimport type { InputHandle } from \'@getcortexlabs/mavis-core\'\n\nconst name = ref(\'\')\nconst bio = ref(\'\')\nconst bioInput = ref<InputHandle>()\n</script>\n\n<template>\n  <m-column gap="lg">\n    <m-input v-model="name" label="Name" returnKey="next" @submit="bioInput?.focus()" />\n    <m-input ref="bioInput" v-model="bio" label="Bio" multiline :maxLength="160" />\n  </m-column>\n</template>',
    properties: [
      {
        name: 'trailingAction',
        type: 'InputAction { icon, label, disabled? }',
        defaultValue: 'none',
        description:
          'Named icon button inside the field; emits action. Cannot be combined with trailingIcon.',
      },
      {
        name: 'modelValue / v-model',
        type: 'string',
        defaultValue: "''",
        description: 'Full text, without trimming or numeric conversion.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Visible label and editor name.',
      },
      {
        name: 'placeholder',
        type: 'string',
        defaultValue: "''",
        description: 'Hint inside an empty editor.',
      },
      {
        name: 'helperText',
        type: 'string',
        defaultValue: "''",
        description: 'Help below the editor.',
      },
      {
        name: 'error',
        type: 'string',
        defaultValue: "''",
        description: 'Nonempty messages replace help and mark the field invalid.',
      },
      {
        name: 'type',
        type: 'text | email | password | tel | url | search',
        defaultValue: 'text',
        description:
          'Editing purpose and keyboard hint. Web email/URL fields also participate in browser constraint validation.',
      },
      {
        name: 'name / autocomplete / form',
        type: 'string',
        defaultValue: 'not set',
        description: 'Web only: submitted field name, autofill hint and owning form ID.',
      },
      {
        name: 'required',
        type: 'boolean',
        defaultValue: 'false',
        description: "Web only: participates in the browser's required-field validation.",
      },
      {
        name: 'inputmode',
        type: 'none | text | decimal | numeric | tel | search | email | url',
        defaultValue: 'not set',
        description: "Web only: virtual keyboard hint, without changing the value's type.",
      },
      {
        name: 'disabled / readonly',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Prevents editing, focus and interaction.',
      },
      {
        name: 'multiline',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Allows newlines; requires type="text".',
      },
      {
        name: 'rows',
        type: 'number',
        defaultValue: '3',
        description: 'Positive integer; approximate minimum height for multiline fields.',
      },
      {
        name: 'maxLength',
        type: 'number',
        defaultValue: 'sem limite',
        description: 'Integer from 0 to 2147483647; limits user edits in UTF-16 code units.',
      },
      {
        name: 'icon / trailingIcon',
        type: 'IconName',
        defaultValue: 'none',
        description:
          'Decorative Lucide icons inside the editor box, muted or danger while error is set; the editor padding makes room for them.',
      },
      {
        name: 'autocapitalize',
        type: 'none | sentences | words | characters',
        defaultValue: 'sentences / none',
        description: 'Keyboard capitalization hint.',
      },
      {
        name: 'autocorrect',
        type: 'boolean',
        defaultValue: 'true / false',
        description: 'Correction and Web spelling hint.',
      },
      {
        name: 'returnKey',
        type: 'done | next | go | search | send',
        defaultValue: 'done',
        description: 'Keyboard action hint for a single-line editor.',
      },
      {
        name: 'width / grow / shrink',
        type: 'dimension / number',
        defaultValue: 'auto / 0 / context',
        description: 'Size the whole field, including label and message.',
      },
      {
        name: 'id',
        type: 'string',
        defaultValue: 'automático na Web',
        description: 'Identifies the editor.',
      },
    ],
    events: [
      {
        name: 'action',
        payload: 'none',
        description:
          'Activates the trailing action; the app changes value/type. Retains editor focus and does not submit forms.',
      },
      {
        name: 'update:modelValue',
        payload: 'string',
        description: 'Complete editor text, including intermediate IME values.',
      },
      {
        name: 'focus / blur',
        payload: 'none',
        description: 'Entering and leaving editor focus.',
      },
      {
        name: 'submit',
        payload: 'string',
        description: 'Keyboard action in a single-line editor; does not automatically end focus.',
      },
    ],
    behavior:
      'Refs expose focus()/blur() through InputHandle, InstanceType or useTemplateRef. Web ARIA and editing listeners reach the editor; class/style remain on the container. Without @submit, Enter follows HTML forms; with @submit, the handler owns the action. Models control reset: handle @reset.prevent. The app owns validation/persistence. Do not reformat on every keystroke: that can interrupt composition/selection. Native readonly does not open the keyboard; selection/copy depend on the platform. Use within a scrolling Screen for keyboard handling.',
  },
  button: {
    usage: '<m-button variant="primary" @click="save">Save</m-button>',
    properties: [
      {
        name: 'href',
        type: 'string',
        defaultValue: '—',
        description: 'Destination; enables navigation in Button/Card.',
      },
      {
        name: 'navigate',
        type: '(href: string) => void | Promise',
        defaultValue: '—',
        description: 'Host navigation; required for native internal routes.',
      },
      {
        name: 'target',
        type: '_self | _blank',
        defaultValue: '_self',
        description: 'Web browsing context.',
      },
      {
        name: 'rel',
        type: 'string',
        defaultValue: '—',
        description: 'Web relationship. _blank adds noopener/noreferrer.',
      },
      {
        name: 'slots leading / trailing',
        type: 'decorative content',
        defaultValue: 'omitidos',
        description:
          'Override icon/trailingIcon. Decorative and excluded from the accessible name; do not nest controls.',
      },
      {
        name: 'motionSurface',
        type: 'MotionSurface (experimental)',
        defaultValue: 'not set',
        description:
          'Reference from createMotionSurface(), available after mount/load. Shares application motion while preserving the press layer. See the motion guide.',
      },
      {
        name: 'type',
        type: 'button | submit | reset',
        defaultValue: 'button',
        description: 'Web only: HTML button action.',
      },
      {
        name: 'name / value / form',
        type: 'string',
        defaultValue: 'not set',
        description: 'Web only: submitter name/value and owning form ID.',
      },
      {
        name: 'variant',
        type: 'primary | secondary | ghost',
        defaultValue: 'primary',
        description: 'Button appearance.',
      },
      {
        name: 'size',
        type: 'sm | md | lg',
        defaultValue: 'md',
        description: 'Minimum height, font and padding.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Prevents activation.',
      },
      {
        name: 'loading',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Prevents activation and shows loadingText.',
      },
      {
        name: 'loadingText',
        type: 'string',
        defaultValue: 'Loading…',
        description: 'Text shown while loading.',
      },
      {
        name: 'text',
        type: 'string',
        defaultValue: 'slot',
        description: 'Alternative to slot text.',
      },
      {
        name: 'icon / trailingIcon',
        type: 'IconName',
        defaultValue: 'none',
        description:
          'Lucide icon before or after the text, sized with the button. An icon-only button requires accessibilityLabel; otherwise rendering throws RangeError.',
      },
      {
        name: 'accessibilityLabel',
        type: 'string',
        defaultValue: 'visible text',
        description: 'Announced name when visible text does not fully describe the action.',
      },
      {
        name: 'grow / shrink',
        type: 'number',
        defaultValue: '0 / context',
        description: 'Space distribution within the parent layout.',
      },
    ],
    events: [
      {
        name: '@click',
        payload: 'none',
        description: 'Emitted on allowed activation, never while disabled or loading.',
      },
      {
        name: '@error',
        payload: 'unknown',
        description: 'Host navigation or URL opening failed.',
      },
    ],
    behavior:
      'The default slot accepts plain/interpolated text. Jolt animates press on both renderers. Web Enter/Space activate a button, and loading preserves focus. href renders a real link and supports RouterLink custom-slot navigation without nesting an anchor.',
  },
  slider: {
    usage: '<m-slider v-model="temperature" :min="16" :max="28" :step="0.5" label="Temperature" />',
    properties: [
      {
        name: 'v-model',
        type: 'number',
        defaultValue: '0',
        description: 'Selected value.',
      },
      {
        name: 'min',
        type: 'number',
        defaultValue: '0',
        description: 'Lower bound.',
      },
      {
        name: 'max',
        type: 'number',
        defaultValue: '100',
        description: 'Upper bound.',
      },
      {
        name: 'step',
        type: 'number',
        defaultValue: '1',
        description: 'Step greater than zero.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'required',
        description: 'Accessible control name.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Prevents interaction.',
      },
    ],
    events: [
      {
        name: '@update:modelValue',
        payload: 'number',
        description: 'Emits the step-adjusted value. v-model connects it to application state.',
      },
    ],
    behavior:
      'All numbers must be finite. The final step reaches max even when the range is not divisible by step. VoiceOver/TalkBack use real range values and advance one step per adjustment. On Web, use arrows, Home and End.',
  },
  card: {
    usage:
      '<m-card gap="md">\n  <m-text variant="heading">Your space</m-text>\n  <m-text tone="muted">Content that belongs together.</m-text>\n</m-card>',
    properties: [
      {
        name: 'href',
        type: 'string',
        defaultValue: '—',
        description: 'Destination; enables navigation in Button/Card.',
      },
      {
        name: 'navigate',
        type: '(href: string) => void | Promise',
        defaultValue: '—',
        description: 'Host navigation; required for native internal routes.',
      },
      {
        name: 'target',
        type: '_self | _blank',
        defaultValue: '_self',
        description: 'Web browsing context.',
      },
      {
        name: 'rel',
        type: 'string',
        defaultValue: '—',
        description: 'Web relationship. _blank adds noopener/noreferrer.',
      },
      {
        name: 'motionSurface',
        type: 'MotionSurface (experimental)',
        defaultValue: '—',
        description:
          'Reference for motion, continuous values and drag/snap on the same component. See the motion guide.',
      },
      {
        name: 'gap',
        type: 'token | number',
        defaultValue: 'none',
        description: 'Space between children.',
      },
      {
        name: 'padding',
        type: 'token | number',
        defaultValue: 'theme (lg)',
        description: 'Internal spacing.',
      },
      {
        name: 'elevation',
        type: 'none | sm | md | lg',
        defaultValue: 'theme (none)',
        description: 'Decorative themed shadow; does not change stacking order.',
      },
      {
        name: 'radius',
        type: 'token | number',
        defaultValue: 'lg',
        description: 'Surface corners.',
      },
      {
        name: 'interactive',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Makes the entire surface an action.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Disables an interactive card.',
      },
      {
        name: 'accessibilityLabel',
        type: 'string',
        defaultValue: '—',
        description: 'Accessible name of the action.',
      },
    ],
    events: [
      {
        name: '@click',
        payload: 'none',
        description:
          'Emitted by allowed pointer/keyboard activation in interactive or navigation mode.',
      },
      {
        name: '@error',
        payload: 'unknown',
        description: 'Host navigation or URL opening failed.',
      },
    ],
    behavior:
      'An ordinary card groups content. An interactive card with accessibilityLabel represents one action; its Mavis descendants do not add reading stops. Do not nest buttons, links or editors. href uses navigation semantics with one real anchor on Web and explicit host navigation natively.',
    layout: true,
  },
  text: {
    usage:
      '<m-text as="h1" variant="title">The day is yours.</m-text>\n<m-text tone="muted">Ready when you are.</m-text>',
    properties: [
      {
        name: 'variant',
        type: 'display | title | heading | body | caption | overline',
        defaultValue: 'body',
        description: 'Theme typography scale.',
      },
      {
        name: 'weight',
        type: 'normal | bold | 100 … 900 (strings)',
        defaultValue: 'theme',
        description: 'Weight independent of size.',
      },
      {
        name: 'MSpan',
        type: 'text / weight / tone / emphasis',
        defaultValue: 'none',
        description:
          'Runs inside the same text; strong or em emphasis. Does not accept views or events.',
      },
      {
        name: 'tone',
        type: 'chave da paleta',
        defaultValue: 'text',
        description: 'Semantic color.',
      },
      {
        name: 'as',
        type: 'p | span | h1 … h6',
        defaultValue: 'p',
        description: 'Semantics independent of appearance.',
      },
      {
        name: 'align',
        type: 'left | center | right',
        defaultValue: 'left',
        description: 'Text alignment.',
      },
      {
        name: 'wrap',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Allows line wrapping.',
      },
      {
        name: 'text',
        type: 'string',
        defaultValue: 'slot',
        description: 'Alternative to slot text.',
      },
      {
        name: 'grow / shrink',
        type: 'number',
        defaultValue: '0 / context',
        description: 'Space distribution.',
      },
    ],
    behavior:
      'Use as for semantic headings and variant for appearance. Slots accept text and MSpan emphasis, weight and tone. Runs preserve reading order and system scaling inside one text element. Use layouts for other views.',
  },
  icon: {
    usage:
      '<m-row gap="sm" align="center">\n  <m-icon name="search" tone="muted" />\n  <m-text>Search</m-text>\n</m-row>\n<m-icon name="circle-check" tone="success" label="Done" />',
    properties: [
      {
        name: 'name',
        type: 'IconName',
        defaultValue: 'required',
        description:
          'Lucide icon name, such as search or circle-check. Unknown names throw RangeError.',
      },
      {
        name: 'size',
        type: 'sm | md | lg | number',
        defaultValue: 'md',
        description: '16, 20 or 24 points, or any positive number.',
      },
      {
        name: 'tone',
        type: 'theme color',
        defaultValue: 'text',
        description: 'Theme color, such as primary, muted or danger.',
      },
      {
        name: 'label',
        type: 'string',
        defaultValue: 'none',
        description:
          'Accessible name. Without it the icon is decorative and hidden from assistive technology.',
      },
      {
        name: 'id',
        type: 'string',
        defaultValue: 'none',
        description: 'Identifies the rendered icon.',
      },
    ],
    behavior:
      'Renders a glyph from the bundled Lucide font. Natively, copy fonts/lucide.ttf into the app fonts directory; Web style.css loads the font. Icons keep their size within Rows and align beside text. Pair with meaningful text; use label only for an icon standing alone.',
  },
  row: {
    usage:
      '<m-row gap="sm" align="center">\n  <m-button :grow="1">Continue</m-button>\n  <m-button variant="ghost">Cancel</m-button>\n</m-row>',
    properties: [
      {
        name: 'gap',
        type: 'token | number',
        defaultValue: 'none',
        description: 'Space between children.',
      },
      {
        name: 'align',
        type: 'start | center | end | stretch',
        defaultValue: 'center',
        description: 'Cross-axis alignment.',
      },
      {
        name: 'justify',
        type: 'start | center | end | between | around',
        defaultValue: 'start',
        description: 'Horizontal distribution.',
      },
      {
        name: 'wrap',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Allows multiple lines.',
      },
    ],
    behavior:
      'Children flow side by side. grow/shrink belong on the child that takes or yields space. Use wrap for multiple lines.',
    layout: true,
  },
  column: {
    usage:
      '<m-column gap="md" padding="lg">\n  <m-text variant="title">Welcome.</m-text>\n  <m-button>Get started</m-button>\n</m-column>',
    properties: [
      {
        name: 'gap',
        type: 'token | number',
        defaultValue: 'none',
        description: 'Space between children.',
      },
      {
        name: 'align',
        type: 'start | center | end | stretch',
        defaultValue: 'stretch',
        description: 'Horizontal alignment.',
      },
      {
        name: 'justify',
        type: 'start | center | end | between | around',
        defaultValue: 'start',
        description: 'Vertical distribution.',
      },
      {
        name: 'wrap',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Wraps into columns when height is constrained.',
      },
    ],
    behavior:
      'Children flow vertically and preserve natural height. Native and Web share spacing tokens.',
    layout: true,
  },
  box: {
    usage:
      '<m-box :height="160" radius="lg" backgroundColor="#202C25">\n  <m-column padding="lg"><m-text>Background layer</m-text></m-column>\n  <m-column justify="end" align="end" padding="md">\n    <m-button size="sm">Open</m-button>\n  </m-column>\n</m-box>',
    properties: [
      {
        name: 'width / height',
        type: 'number | auto | %',
        defaultValue: 'auto',
        description: 'Area dimensions.',
      },
      {
        name: 'radius',
        type: 'token | number',
        defaultValue: 'none',
        description: 'Area corners.',
      },
      {
        name: 'backgroundColor',
        type: 'string',
        defaultValue: 'transparent',
        description: 'Optional background color.',
      },
    ],
    behavior:
      'All children occupy the same area; later children appear above earlier ones. Use Row/Column inside each layer to arrange content.',
    layout: true,
  },
  screen: {
    usage:
      '<m-screen scroll>\n  <m-column padding="lg" gap="md">\n    <m-text as="h1" variant="title">Your screen</m-text>\n    <m-card><m-text>Your content.</m-text></m-card>\n  </m-column>\n</m-screen>',
    properties: [
      {
        name: 'scroll',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Enables vertical scrolling.',
      },
      {
        name: 'motionScroll',
        type: 'MotionScrollSource (experimental)',
        defaultValue: '—',
        description:
          'Shared motion scroll source when scrolling is enabled. See Field Guide and the motion guide.',
      },
      {
        name: 'dismissKeyboard',
        type: 'boolean',
        defaultValue: 'true',
        description:
          'Puts the software keyboard away on a tap outside the editor and, with scroll, on a drag towards it.',
      },
    ],
    behavior:
      'Use one Screen per page. Native scrolling respects safe areas; iOS accommodates the keyboard and Android uses adjustResize. Tapping outside the editor, including on a button, dismisses the keyboard while still activating the control. Web follows the visible viewport and preserves focus on resize. The app owns navigation/state; do not nest Screens.',
  },
  sheet: {
    usage:
      '<m-button @click="open = true">Filters</m-button>\n<m-sheet v-model:open="open" title="Filters" @close="last = $event">\n  <m-text>Choose what to show.</m-text>\n  <m-button @click="open = false">Apply</m-button>\n</m-sheet>',
    properties: [
      {
        name: 'open',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Presents or dismisses the sheet. Bind it with v-model:open.',
      },
      {
        name: 'accessibilityLabel',
        type: 'string',
        defaultValue: 'none',
        description: 'Required when the title is absent or blank; does not add a visible heading.',
      },
      {
        name: 'title',
        type: 'string',
        defaultValue: 'none',
        description: 'Heading and accessible name. Without it, accessibilityLabel is required.',
      },
      {
        name: 'dismissible',
        type: 'boolean',
        defaultValue: 'true',
        description:
          'Allows the scrim, Escape, the back gesture, a swipe down and the close button.',
      },
      {
        name: 'fullscreen',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Fills the usable height instead of fitting the content.',
      },
      {
        name: 'closeLabel',
        type: 'string',
        defaultValue: 'Close',
        description: 'Accessible name of the close button.',
      },
      {
        name: 'padding',
        type: 'token | number',
        defaultValue: 'lg',
        description: 'Inner spacing of the panel.',
      },
      {
        name: 'gap',
        type: 'token | number',
        defaultValue: 'none',
        description: 'Space between content children.',
      },
      {
        name: 'align',
        type: 'start | center | end | stretch',
        defaultValue: 'stretch',
        description: 'Horizontal alignment of content.',
      },
      {
        name: 'id',
        type: 'string',
        defaultValue: 'none',
        description: 'Identifies the rendered panel.',
      },
    ],
    events: [
      {
        name: 'update:open',
        payload: 'boolean',
        description: 'Requests opening or closing.',
      },
      {
        name: 'close',
        payload: 'button | backdrop | escape | back | swipe | program',
        description: 'Reason for closing, emitted when closing is requested.',
      },
    ],
    behavior:
      'Natively, an in-page layer above Screen content uses Jolt bottom-sheet motion: drag handle, content/full-height snaps, scrim, keyboard handling and Android Back. Web uses a modal dialog with Jolt playback and handle dragging: Escape, backdrop dismissal, contained/restored focus. Content mounts on opening and unmounts after closing. Requires an ancestor MScreen natively. Names are validated even when closed and on updates; title takes precedence over accessibilityLabel. For asynchronous titles, supply an alternative name or use v-if.',
  },
  reveal: {
    usage:
      '<m-button @click="visible = !visible">Details</m-button>\n<m-reveal :show="visible">\n  <m-card><m-text>A little more context.</m-text></m-card>\n</m-reveal>',
    properties: [
      {
        name: 'show',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Inserts or removes content.',
      },
      {
        name: 'gap',
        type: 'token | number',
        defaultValue: 'none',
        description: 'Space between children. Accepts theme tokens or nonnegative numbers.',
      },
      {
        name: 'align',
        type: 'start | center | end | stretch',
        defaultValue: 'stretch',
        description: 'Horizontal alignment of children.',
      },
      {
        name: 'justify',
        type: 'start | center | end | between | around',
        defaultValue: 'start',
        description: 'Vertical distribution of content.',
      },
      {
        name: 'wrap',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Allows additional columns when height is constrained.',
      },
    ],
    layout: true,
    behavior:
      'Animates height between zero and auto with opacity through Jolt. Closing keeps the content mounted and rapid reversals keep the same subtree. Closing restores focus before disabling content. Reduced motion and cleanup follow the platform lifecycle.',
  },
  grid: {
    usage: `<m-grid :columns="3" :min-column-width="180" gap="md">
  <m-card>One idea</m-card>
  <m-card>Another idea</m-card>
</m-grid>`,
    properties: [
      {
        name: 'columns',
        type: 'number',
        defaultValue: '—',
        description: 'Fixed columns, or a maximum with minColumnWidth.',
      },
      {
        name: 'minColumnWidth',
        type: 'number',
        defaultValue: '—',
        description: 'Desired minimum column width in CSS pixels or DIPs.',
      },
      {
        name: 'gap',
        type: 'Spacing',
        defaultValue: 'none',
        description: 'Horizontal and vertical spacing token.',
      },
    ],
    behavior:
      'Equal columns follow available width while keeping children mounted. SSR uses one column without columns.',
    layout: true,
  },
  stack: {
    usage:
      '<m-stack gap="md" :responsive="{ at: 640, direction: \'row\', gap: \'lg\' }">\n  <m-input label="Name" />\n  <m-button>Continue</m-button>\n</m-stack>',
    properties: [
      {
        name: 'direction',
        type: 'row | column',
        defaultValue: 'column',
        description: 'Base direction before measurement and below the first breakpoint.',
      },
      {
        name: 'responsive',
        type: 'StackBreakpoint | StackBreakpoint[]',
        defaultValue: '—',
        description: 'Overrides by content width: at, direction, gap, align, justify and wrap.',
      },
    ],
    behavior:
      'Measures available content width without remounting children. SSR starts with the base direction.',
    layout: true,
  },
  link: {
    usage:
      '<m-link href="https://mavis-ui.getcortexlabs.com/" target="_blank">Explore Mavis</m-link>',
    properties: [
      {
        name: 'href',
        type: 'string',
        defaultValue: '—',
        description: 'Destination; enables navigation in Button/Card.',
      },
      {
        name: 'navigate',
        type: '(href: string) => void | Promise',
        defaultValue: '—',
        description: 'Host navigation; required for native internal routes.',
      },
      {
        name: 'target',
        type: '_self | _blank',
        defaultValue: '_self',
        description: 'Web browsing context.',
      },
      {
        name: 'rel',
        type: 'string',
        defaultValue: '—',
        description: 'Web relationship. _blank adds noopener/noreferrer.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Retains the label and blocks activation.',
      },
      {
        name: 'inline',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Inline Web presentation without a minimum touch height.',
      },
    ],
    events: [
      {
        name: '@click',
        payload: 'none',
        description: 'Allowed activation.',
      },
      {
        name: '@error',
        payload: 'unknown',
        description: 'Navigation adapter failed.',
      },
    ],
    behavior:
      'A real Web link, preserving Ctrl/Cmd click. The native host resolves internal routes; the system opens external URLs.',
  },
}
