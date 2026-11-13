import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { components } from '../packages/create-mavis/templates/macos/scripts/portable/components/index.mjs'
import { componentProps } from '../packages/core/src/vue/component-props'

const portable = new URL('./portable/', import.meta.url).pathname

type Output = {
  model: { components: { name: string; view: unknown }[]; records: unknown[] }
  vue: Map<string, string>
  native: Map<string, string>
  swift: Map<string, string>
  direct: string[]
}
const shared = (files: Record<string, string>) =>
  new Map(Object.entries(files).map(([name, text]) => [`shared/${name}`, text]))
const compile = (files: Record<string, string>): Promise<Output> =>
  compileProject(shared(files), { root: 'Home' })
const tsx = (view: string, store = "on: false, count: 3, tone: 'primary' as MavisBadgeTone") =>
  `import { useStore } from '@builder.io/mitosis'\n\nexport default function Home() {\n  const state = useStore({ ${store} })\n  return (\n${view}\n  )\n}\n`
const vue = (script: string, template: string) =>
  `<script setup lang="ts">\n${script}\n</script>\n\n<template>\n${template}\n</template>\n`
const portableModel = ({ model }: Output) =>
  JSON.parse(
    JSON.stringify(model, (key, value) =>
      key === 'path' ? undefined : value instanceof Map ? [...value.keys()] : value,
    ),
  )
const swiftOf = ({ swift }: Output) =>
  [...swift].map(([name, text]) => [name, text.split('\n').slice(1).join('\n')])
const failure = (files: Record<string, string>) =>
  compile(files).then(
    () => undefined,
    (error: Error) => error,
  )

// The same screen in both formats: one model, one SwiftUI, and the Vue file runs as written.
async function bothFormats(fixture: string, root: string) {
  const fromTsx: Output = await compileProject(await readShared(join(portable, fixture)), { root })
  const fromVue: Output = await compileProject(await readShared(join(portable, `${fixture}Vue`)), {
    root,
  })
  expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
  expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
  expect(fromVue.direct).toEqual(
    fromTsx.model.components.map((component) => `shared/${component.name}.vue`),
  )
  return fromTsx
}

describe('feedback components and the published contracts', () => {
  // What the portable sources name themselves instead of taking it from a contract.
  const own: Record<string, string[]> = {
    MBadge: [],
    MProgress: [],
    MSkeleton: [],
    // onClose is the contract's close event.
    MAlert: ['onClose'],
    MEmptyState: [],
    // selected and onChange are the contract's modelValue and its update; onRemove its remove event.
    MChip: ['selected', 'onChange', 'onRemove'],
    MTooltip: [],
    MToast: [],
    MNotificationCenter: ['value', 'onChange', 'onUpdateFilter', 'onAction'],
  }

  it.each(Object.keys(own))('%s takes only properties of its contract', (name) => {
    const contract = Object.keys(componentProps[name as keyof typeof componentProps])
    const accepted = Object.keys(components[name].props).filter(
      (prop) => !own[name]!.includes(prop),
    )
    expect(accepted.filter((prop) => !contract.includes(prop))).toEqual([])
  })
})

describe('MBadge', () => {
  it('reads the badge fixture into one model from TSX and from Vue', async () => {
    const { swift, vue: web, native } = await bothFormats('badge', 'Badges')
    for (const output of [web, native]) {
      const view = output.get('Badges.vue')!
      expect(view).toContain('<MBadge id="neutral" text="Draft" />')
      expect(view).toContain('<MBadge id="unread" :text="state.unread" :tone="state.tone" />')
      expect(view).toContain('<MBadge id="small" :text="11" size="sm" tone="accent" />')
      expect(view).toContain(
        '<MBadge id="named" text="3" size="sm" accessibilityLabel="3 replies" />',
      )
    }
    const view = swift.get('Badges.swift')!
    expect(view).toContain('MavisBadge(text: "Draft")\n')
    expect(view).toContain(
      'MavisBadge(text: mavisString(self.unread), tone: MavisBadgeTone(self.tone))',
    )
    expect(view).toContain('MavisBadge(text: mavisString(11.0), size: .sm, tone: .accent)')
    expect(view).toMatch(
      /MavisBadge\(text: "3", size: \.sm\)\n\s+\.accessibilityLabel\(Text\(verbatim: "3 replies"\)\)\n\s+\.accessibilityIdentifier\("named"\)\n\s+\.mavisItem\(align: \.start\)/,
    )
  })

  it('draws the pill from theme colors, as wide as its text', async () => {
    const { swift } = await compile({ 'Home.lite.tsx': tsx('    <MBadge text="New" />') })
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisBadge: View {')
    expect(controls).toContain('struct MavisPillLayout: Layout {')
    expect(controls).toContain(
      'self == .primary ? MavisTokens.primarySoft : self == .accent ? MavisTokens.accentSoft : MavisTokens.elevated',
    )
    expect(controls).toContain('.background(tone.background, in: Capsule())')
  })

  it.each([
    [
      'a badge without text',
      { 'Home.lite.tsx': tsx('    <MBadge tone="primary" />') },
      "Property 'text' is missing in type '{ tone: \"primary\"; }'",
    ],
    [
      'a condition as text',
      { 'Home.lite.tsx': tsx('    <MBadge text={state.on} />') },
      "shared/Home.lite.tsx:6:13: Type 'boolean' is not assignable to type 'string | number'.",
    ],
    [
      'a tone the contract does not have',
      { 'Home.lite.tsx': tsx('    <MBadge text="New" tone="muted" />') },
      'shared/Home.lite.tsx:6:24: Type \'"muted"\' is not assignable',
    ],
    [
      'content inside a badge',
      { 'Home.lite.tsx': tsx('    <MBadge text="New">\n      <MText>x</MText>\n    </MBadge>') },
      "shared/Home.lite.tsx:6:6: Type '{ children: Element; text: string; }' is not assignable",
    ],
    [
      'a property of another component',
      { 'Home.lite.tsx': tsx('    <MBadge text="New" grow={1} />') },
      'shared/Home.lite.tsx:6:24:',
    ],
    [
      'a badge without text in Vue',
      { 'Home.vue': vue("import { MBadge } from '#mavis'", '  <MBadge tone="primary" />') },
      'shared/Home.vue:6:3: MBadge needs text.',
    ],
    [
      'content inside a badge in Vue',
      { 'Home.vue': vue("import { MBadge } from '#mavis'", '  <MBadge text="New">x</MBadge>') },
      'shared/Home.vue:6:3: MBadge takes no children; use its properties.',
    ],
    [
      'a listener on a badge',
      {
        'Home.vue': vue(
          "import { MBadge } from '#mavis'\nfunction go() {}",
          '  <MBadge text="New" @click="go" />',
        ),
      },
      'shared/Home.vue:7:22: MBadge does not take @click on the Mac.',
    ],
  ])('fails on %s', async (_name, files, message) => {
    const error = await failure(files as Record<string, string>)
    expect(error, 'generation must fail').toBeInstanceOf(Error)
    expect(error!.message).toContain(message)
  })
})

describe('MProgress', () => {
  it('reads the progress fixture into one model from TSX and from Vue', async () => {
    const { swift, vue: web, native } = await bothFormats('progress', 'Uploads')
    for (const output of [web, native]) {
      const view = output.get('Uploads.vue')!
      expect(view).toContain(
        '<MProgress id="upload" label="Upload" :value="state.sent" :indeterminate="state.waiting" indeterminateLabel="Waiting for the server" />',
      )
      expect(view).toContain(
        '<MProgress id="thin" label="Storage" :value="3" :max="4" size="sm" tone="success" />',
      )
      expect(view).toContain('<MProgress id="half" label="Sync" :value="60" width="50%" />')
    }
    const view = swift.get('Uploads.swift')!
    expect(view).toMatch(
      /MavisProgress\(label: "Upload", value: self\.sent, indeterminate: self\.waiting, indeterminateLabel: "Waiting for the server"\)\n\s+\.accessibilityIdentifier\("upload"\)\n/,
    )
    expect(view).toContain(
      'MavisProgress(label: "Storage", value: 3.0, max: 4.0, size: .sm, tone: .success)',
    )
    expect(view).toMatch(
      /MavisProgress\(label: "Download", value: 60\.0, tone: \.warning\)\n\s+\.accessibilityIdentifier\("fixed"\)\n\s+\.mavisItem\(width: \.points\(120\.0\)\)/,
    )
    expect(view).toMatch(/\.accessibilityIdentifier\("grown"\)\n\s+\.mavisItem\(grow: 1\.0\)/)
    expect(view).toMatch(
      /\.accessibilityIdentifier\("half"\)\n\s+\.mavisItem\(width: \.fraction\(0\.5\)\)/,
    )
  })

  it('fills the track through Jolt and keeps an indeterminate bar at rest', async () => {
    const { swift } = await compile({
      'Home.lite.tsx': tsx(
        '    <MProgress label="Upload" value={state.count} tone={state.tone} />',
        "count: 3, tone: 'accent' as MavisProgressTone",
      ),
    })
    expect(swift.get('Home.swift')).toContain(
      'MavisProgress(label: "Upload", value: self.count, tone: MavisProgressTone(self.tone))',
    )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisProgress: View {')
    // progressSizes and progressMotion of the Mavis core, and its data transition.
    expect(controls).toMatch(/case \.sm: return 4\n\s+case \.md: return 8\n\s+case \.lg: return 12/)
    expect(controls).toContain('JoltTransition.tween(milliseconds: 432, ease: .easeOut)')
    expect(controls).toContain('.joltLayout(value: ratio, transition: Self.grow)')
    expect(controls).toContain('.frame(width: track.size.width * 0.32)')
    expect(controls).toContain('.offset(x: track.size.width * 0.34)')
    expect(controls).toContain('.accessibilityValue(Text(verbatim: reading))')
    expect(controls).toContain('var color: MavisColor { MavisTokens.tone(rawValue) }')
  })

  it.each([
    [
      'a progress without a label',
      { 'Home.lite.tsx': tsx('    <MProgress value={state.count} />') },
      "Property 'label' is missing in type",
    ],
    [
      'a blank label',
      { 'Home.lite.tsx': tsx('    <MProgress label=" " value={state.count} />') },
      'shared/Home.lite.tsx:6:16: label names the progress: it cannot be blank.',
    ],
    [
      'a blank indeterminateLabel',
      {
        'Home.lite.tsx': tsx(
          '    <MProgress label="Upload" indeterminate indeterminateLabel="" />',
        ),
      },
      'shared/Home.lite.tsx:6:45: indeterminateLabel is what assistive technology reads while the end is unknown: it cannot be blank.',
    ],
    [
      'a max that is not positive',
      { 'Home.lite.tsx': tsx('    <MProgress label="Upload" value={state.count} max={0} />') },
      'shared/Home.lite.tsx:6:51: max must be positive.',
    ],
    [
      'a size the contract does not have',
      { 'Home.lite.tsx': tsx('    <MProgress label="Upload" size="xl" />') },
      'shared/Home.lite.tsx:6:31: Type \'"xl"\' is not assignable',
    ],
    [
      'text as a value',
      { 'Home.lite.tsx': tsx('    <MProgress label="Upload" value="half" />') },
      "shared/Home.lite.tsx:6:31: Type 'string' is not assignable to type 'number'.",
    ],
    [
      'a progress without a label in Vue',
      { 'Home.vue': vue("import { MProgress } from '#mavis'", '  <MProgress :value="3" />') },
      'shared/Home.vue:6:3: MProgress needs label.',
    ],
    [
      'v-model on a progress',
      {
        'Home.vue': vue(
          "import { ref } from 'vue'\nimport { MProgress } from '#mavis'\nconst done = ref(3)",
          '  <MProgress label="Upload" v-model="done" />',
        ),
      },
      'shared/Home.vue:8:29: MProgress does not take v-model on the Mac.',
    ],
    [
      'a max that is not positive in Vue',
      {
        'Home.vue': vue(
          "import { MProgress } from '#mavis'",
          '  <MProgress label="Upload" :max="-1" />',
        ),
      },
      'shared/Home.vue:6:29: max must be positive.',
    ],
  ])('fails on %s', async (_name, files, message) => {
    const error = await failure(files as Record<string, string>)
    expect(error, 'generation must fail').toBeInstanceOf(Error)
    expect(error!.message).toContain(message)
  })
})

describe('MSkeleton', () => {
  it('reads the skeleton fixture into one model from TSX and from Vue', async () => {
    const { swift, vue: web, native } = await bothFormats('skeleton', 'Loading')
    for (const output of [web, native]) {
      const view = output.get('Loading.vue')!
      expect(view).toContain('<MSkeleton id="avatar" :width="48" :height="48" radius="full" />')
      expect(view).toContain('<MSkeleton id="name" />')
      expect(view).toContain(
        '<MSkeleton id="cover" :height="120" radius="md" effect="shimmer" :animated="state.moving" />',
      )
    }
    const view = swift.get('Loading.swift')!
    expect(view).toMatch(
      /MavisSkeleton\(radius: 999\)\n\s+\.mavisIdentifier\("avatar"\)\n\s+\.mavisItem\(width: \.points\(48\.0\), height: \.points\(48\.0\), align: \.start\)/,
    )
    // 16 units tall and stretched across its column unless the source says otherwise.
    expect(view).toMatch(
      /MavisSkeleton\(\)\n\s+\.mavisIdentifier\("name"\)\n\s+\.mavisItem\(height: \.points\(16\.0\), align: \.stretch\)/,
    )
    expect(view).toMatch(
      /MavisSkeleton\(\)\n\s+\.mavisIdentifier\("role"\)\n\s+\.mavisItem\(width: \.fraction\(0\.6\), height: \.points\(12\.0\), align: \.start\)/,
    )
    expect(view).toMatch(
      /MavisSkeleton\(radius: 16, animated: self\.moving, shimmer: true\)\n\s+\.mavisIdentifier\("cover"\)\n\s+\.mavisItem\(height: \.points\(120\.0\), align: \.stretch\)/,
    )
    expect(view).toMatch(
      /MavisSkeleton\(animated: self\.moving\)\n\s+\.mavisIdentifier\("grown"\)\n\s+\.mavisItem\(grow: 1\.0, height: \.fraction\(1\.0\), align: \.stretch\)/,
    )
  })

  it('sweeps the shimmer with Jolt and hides the block from assistive technology', async () => {
    const { swift } = await compile({
      'Home.lite.tsx': tsx(
        '    <MColumn>\n      <MSkeleton effect={state.on ? \'shimmer\' : \'pulse\'} height="auto" />\n      <MSkeleton effect="pulse" width="auto" />\n    </MColumn>',
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toMatch(
      /MavisSkeleton\(shimmer: \(self\.on \? "shimmer" : "pulse"\) == "shimmer"\)\n\s+\.mavisItem\(align: \.stretch\)/,
    )
    expect(view).toMatch(
      /MavisSkeleton\(\)\n\s+\.mavisItem\(height: \.points\(16\.0\), align: \.stretch\)/,
    )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisSkeleton: View {')
    expect(controls).toContain('var radius: Double = 10')
    expect(controls).toContain('_shimmer = StateObject(wrappedValue: try! JoltShimmer())')
    expect(controls).toContain('content().joltShimmer(shimmer)')
    expect(controls).toMatch(
      /MavisShimmer \{ block \}[^]*?\.accessibilityHidden\(true\)\n\s+\.allowsHitTesting\(false\)/,
    )
  })

  it.each([
    [
      'an effect the contract does not have',
      { 'Home.lite.tsx': tsx('    <MSkeleton effect="wave" />') },
      'shared/Home.lite.tsx:6:16: Type \'"wave"\' is not assignable',
    ],
    [
      'a negative height',
      { 'Home.lite.tsx': tsx('    <MSkeleton height={-16} />') },
      'shared/Home.lite.tsx:6:16: height cannot be negative.',
    ],
    [
      'a width that is not a size',
      { 'Home.lite.tsx': tsx('    <MSkeleton width="wide" />') },
      'shared/Home.lite.tsx:6:16: Type \'"wide"\' is not assignable',
    ],
    [
      'a name for a block nobody reads',
      { 'Home.lite.tsx': tsx('    <MSkeleton accessibilityLabel="Loading" />') },
      "Property 'accessibilityLabel' does not exist",
    ],
    [
      'content inside a skeleton in Vue',
      {
        'Home.vue': vue(
          "import { MSkeleton, MText } from '#mavis'",
          '  <MSkeleton><MText>x</MText></MSkeleton>',
        ),
      },
      'shared/Home.vue:6:3: MSkeleton takes no children; use its properties.',
    ],
    [
      'a name for a block nobody reads in Vue',
      {
        'Home.vue': vue(
          "import { MSkeleton } from '#mavis'",
          '  <MSkeleton accessibilityLabel="Loading" />',
        ),
      },
      'shared/Home.vue:6:14: MSkeleton does not take accessibilityLabel on the Mac. It supports id, grow, shrink, width, height, radius, animated, effect.',
    ],
  ])('fails on %s', async (_name, files, message) => {
    const error = await failure(files as Record<string, string>)
    expect(error, 'generation must fail').toBeInstanceOf(Error)
    expect(error!.message).toContain(message)
  })
})

describe('MAlert', () => {
  it('reads the alert fixture into one model from TSX and from Vue', async () => {
    const { swift, vue: web, native } = await bothFormats('alert', 'Notices')
    for (const output of [web, native]) {
      const view = output.get('Notices.vue')!
      expect(view).toContain(
        '<MAlert id="saved" title="Draft saved" tone="success" :dismissible="true" closeLabel="Dismiss saved" @close="() => state.saved = false" />',
      )
      expect(view).toMatch(
        /<MAlert id="failed" title="Upload failed" :description="`Tried \$\{state\.tries\} times\.`" :tone="state\.tone" :announce="true">\n\s+<template #actions>\n\s+<MButton id="retry" text="Retry" size="sm"/,
      )
    }
    const view = swift.get('Notices.swift')!
    expect(view).toMatch(
      /MavisAlert\(title: "Sync is on", description: "Changes reach your other devices in a moment\."\)\n\s+\.mavisIdentifier\("sync"\)/,
    )
    expect(view).toMatch(
      /MavisAlert\(title: "Draft saved", tone: \.success, dismissible: true, closeLabel: "Dismiss saved", onClose: \{\n\s+self\.saved = false\n\s+\}\)\n\s+\.mavisIdentifier\("saved"\)/,
    )
    // The actions are a labelled closure: a trailing one would be taken for onClose.
    expect(view).toMatch(
      /MavisAlert\(title: "Upload failed", description: "Tried \\\(mavisString\(self\.tries\)\) times\.", tone: MavisAlertTone\(self\.tone\), actions: \{\n\s+Button\(action: \{/,
    )
    expect(view).toMatch(
      /MavisAlert\(title: "Almost full", tone: \.warning\)\n\s+\.mavisIdentifier\("narrow"\)\n\s+\.mavisItem\(width: \.points\(240\.0\)\)/,
    )
  })

  it('draws the tone, its icon and the close button from the theme', async () => {
    const { swift } = await compile({ 'Home.lite.tsx': tsx('    <MAlert title="Saved" />') })
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisAlert<Actions: View>: View {')
    // alertAppearance of the Mavis core: info, circle-check, triangle-alert and circle-alert.
    expect(controls).toMatch(
      /case \.info: return MavisTokens\.accent\n\s+case \.success: return MavisTokens\.success\n\s+case \.warning: return MavisTokens\.warning\n\s+case \.error: return MavisTokens\.danger/,
    )
    expect(controls).toMatch(
      /case \.info: return "\\u\{e0f9\}"\n\s+case \.success: return "\\u\{e226\}"\n\s+case \.warning: return "\\u\{e193\}"\n\s+case \.error: return "\\u\{e077\}"/,
    )
    expect(controls).toContain(
      'MavisGlyphButton(glyph: "\\u{e1b2}", label: closeLabel, action: onClose)',
    )
    expect(controls).toContain('.strokeBorder(tone.color, lineWidth: 1)')
    expect(controls).toContain('if Actions.self != EmptyView.self {')
    expect(controls).toContain('struct MavisGlyphButton: View {')
  })

  it.each([
    [
      'an alert without a title',
      { 'Home.lite.tsx': tsx('    <MAlert description="x" />') },
      "Property 'title' is missing in type",
    ],
    [
      'a blank title',
      { 'Home.lite.tsx': tsx('    <MAlert title="" />') },
      'shared/Home.lite.tsx:6:13: title is the message: it cannot be blank.',
    ],
    [
      'a blank closeLabel',
      { 'Home.lite.tsx': tsx('    <MAlert title="Saved" dismissible closeLabel=" " />') },
      'shared/Home.lite.tsx:6:39: closeLabel names the close button: it cannot be blank.',
    ],
    [
      'onClose on an alert nobody can close',
      { 'Home.lite.tsx': tsx('    <MAlert title="Saved" onClose={() => (state.on = false)} />') },
      'shared/Home.lite.tsx:6:27: onClose needs dismissible: the close button of the alert is what reports it.',
    ],
    [
      'a tone the contract does not have',
      { 'Home.lite.tsx': tsx('    <MAlert title="Saved" tone="danger" />') },
      'shared/Home.lite.tsx:6:27: Type \'"danger"\' is not assignable',
    ],
    [
      'a slot the alert does not have',
      { 'Home.lite.tsx': tsx('    <MAlert title="Saved" slotFooter={<MText>x</MText>} />') },
      "Property 'slotFooter' does not exist",
    ],
    [
      'content between the tags',
      { 'Home.lite.tsx': tsx('    <MAlert title="Saved">\n      <MText>x</MText>\n    </MAlert>') },
      "Property 'children' does not exist",
    ],
    [
      'an alert inside a card that is one button',
      {
        'Home.lite.tsx': tsx(
          '    <MCard label="Open" onClick={() => (state.on = true)}>\n      <MAlert title="Saved" />\n    </MCard>',
        ),
      },
      'shared/Home.lite.tsx:6:5: A card with onClick shows text only; put buttons and fields outside it.',
    ],
    [
      'an alert without a title in Vue',
      { 'Home.vue': vue("import { MAlert } from '#mavis'", '  <MAlert tone="success" />') },
      'shared/Home.vue:6:3: MAlert needs title.',
    ],
    [
      '@close on an alert nobody can close',
      {
        'Home.vue': vue(
          "import { MAlert } from '#mavis'\nfunction hide() {}",
          '  <MAlert title="Saved" @close="hide" />',
        ),
      },
      'shared/Home.vue:7:25: onClose needs dismissible: the close button of the alert is what reports it.',
    ],
    [
      'content between the tags in Vue',
      {
        'Home.vue': vue(
          "import { MAlert, MText } from '#mavis'",
          '  <MAlert title="Saved"><MText>x</MText></MAlert>',
        ),
      },
      'shared/Home.vue:6:3: MAlert takes no children; give its content as <template #actions>.',
    ],
    [
      'a slot the alert does not have in Vue',
      {
        'Home.vue': vue(
          "import { MAlert, MText } from '#mavis'",
          '  <MAlert title="Saved"><template #footer><MText>x</MText></template></MAlert>',
        ),
      },
      'shared/Home.vue:6:25: MAlert has no slot footer; its slots are actions.',
    ],
  ])('fails on %s', async (_name, files, message) => {
    const error = await failure(files as Record<string, string>)
    expect(error, 'generation must fail').toBeInstanceOf(Error)
    expect(error!.message).toContain(message)
  })
})

describe('MEmptyState', () => {
  it('reads the empty state fixture into one model from TSX and from Vue', async () => {
    const { swift, vue: web, native } = await bothFormats('emptyState', 'Inbox')
    for (const output of [web, native]) {
      const view = output.get('Inbox.vue')!
      expect(view).toMatch(
        /<MEmptyState id="empty" title="No messages yet" description="Messages from your team show up here\." :icon="state\.symbol">\n\s+<template #actions>\n\s+<MButton id="write"/,
      )
      expect(view).toContain(
        '<MEmptyState id="found" title="Nothing found" icon="search" tone="accent" :compact="true" titleAs="h3" />',
      )
      expect(view).toMatch(
        /<MEmptyState id="done" title="All done" :compact="true" :width="240">\n\s+<template #illustration>\n\s+<MColumn :width="40"/,
      )
    }
    const view = swift.get('Inbox.swift')!
    expect(view).toMatch(
      /MavisEmptyState\(title: "No messages yet", description: "Messages from your team show up here\.", glyph: MavisIcons\.glyph\(self\.symbol\), illustration: \{ MavisUnfilledSlot\(\) \}, actions: \{\n\s+Button\(action: \{/,
    )
    expect(view).toMatch(
      /MavisEmptyState\(title: "Nothing found", glyph: "\\u\{e151\}", tone: \.accent, compact: true, level: \.h3, illustration: \{ MavisUnfilledSlot\(\) \}, actions: \{ MavisUnfilledSlot\(\) \}\)\n\s+\.mavisIdentifier\("found"\)/,
    )
    expect(view).toMatch(
      /MavisEmptyState\(title: "All done", compact: true, illustration: \{\n\s+MavisColumn\(spacing: 0\) \{[^]*?\}, actions: \{ MavisUnfilledSlot\(\) \}\)\n\s+\.mavisIdentifier\("done"\)\n\s+\.mavisItem\(width: \.points\(240\.0\)\)/,
    )
  })

  it('draws its own illustration unless the source gives one, and keeps it from the pointer', async () => {
    const { swift } = await compile({
      'Home.lite.tsx': tsx(
        "    <MEmptyState title=\"Nothing\" tone={state.on ? 'accent' : 'primary'} />",
      ),
    })
    expect(swift.get('Home.swift')).toContain(
      'MavisEmptyState(title: "Nothing", tone: MavisEmptyStateTone((self.on ? "accent" : "primary")), illustration: { MavisUnfilledSlot() }, actions: { MavisUnfilledSlot() })',
    )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisEmptyState<Illustration: View, Actions: View>: View {')
    expect(controls).toContain('var glyph: String = "\\u{e0f7}"')
    expect(controls).toContain('if Illustration.self == MavisUnfilledSlot.self {')
    expect(controls).toContain('if Actions.self != MavisUnfilledSlot.self {')
    expect(controls).toContain('private var size: Double { compact ? 64 : 88 }')
    expect(controls).toContain('MavisIcon(glyph: glyph, size: compact ? 28 : 36)')
    expect(controls).toMatch(
      /illustration\(\)\n[^]*?\.accessibilityHidden\(true\)\n\s+\.allowsHitTesting\(false\)/,
    )
    expect(controls).toContain('.accessibilityHeading(level)')
    expect(controls).toContain('.padding(compact ? 24 : 48)')
  })

  it.each([
    [
      'an empty state without a title',
      { 'Home.lite.tsx': tsx('    <MEmptyState description="x" />') },
      "Property 'title' is missing in type",
    ],
    [
      'a blank title',
      { 'Home.lite.tsx': tsx('    <MEmptyState title="  " />') },
      'shared/Home.lite.tsx:6:18: title is what the empty state says: it cannot be blank.',
    ],
    [
      'a heading level from state',
      {
        'Home.lite.tsx': tsx(
          "    <MEmptyState title=\"Nothing\" titleAs={state.on ? 'h2' : 'h3'} />",
        ),
      },
      'shared/Home.lite.tsx:6:34: titleAs is written as a literal, for example titleAs="h3".',
    ],
    [
      'an icon the set does not have',
      { 'Home.lite.tsx': tsx('    <MEmptyState title="Nothing" icon="nothing-here" />') },
      'shared/Home.lite.tsx:6:34: Type \'"nothing-here"\' is not assignable',
    ],
    [
      'a tone the contract does not have',
      { 'Home.lite.tsx': tsx('    <MEmptyState title="Nothing" tone="danger" />') },
      'shared/Home.lite.tsx:6:34: Type \'"danger"\' is not assignable',
    ],
    [
      'a button in the illustration',
      {
        'Home.lite.tsx': tsx(
          '    <MEmptyState\n      title="Nothing"\n      slotIllustration={<MButton text="Add" onClick={() => (state.on = true)} />}\n    />',
        ),
      },
      "shared/Home.lite.tsx:6:5: MEmptyState's illustration is decoration: the Web and the Mac keep it from assistive technology and the pointer, so a button or field there could not be used. Put controls in the actions.",
    ],
    [
      'content between the tags in Vue',
      {
        'Home.vue': vue(
          "import { MEmptyState, MText } from '#mavis'",
          '  <MEmptyState title="Nothing"><MText>x</MText></MEmptyState>',
        ),
      },
      'shared/Home.vue:6:3: MEmptyState takes no children; give its content as <template #illustration> or <template #actions>.',
    ],
    [
      'a button in the illustration in Vue',
      {
        'Home.vue': vue(
          "import { MButton, MEmptyState } from '#mavis'\nfunction add() {}",
          '  <MEmptyState title="Nothing"><template #illustration><MButton text="Add" @click="add" /></template></MEmptyState>',
        ),
      },
      "shared/Home.vue:7:3: MEmptyState's illustration is decoration:",
    ],
    [
      'a slot the empty state does not have in Vue',
      {
        'Home.vue': vue(
          "import { MEmptyState, MText } from '#mavis'",
          '  <MEmptyState title="Nothing"><template #footer><MText>x</MText></template></MEmptyState>',
        ),
      },
      'MEmptyState has no slot footer; its slots are illustration, actions.',
    ],
  ])('fails on %s', async (_name, files, message) => {
    const error = await failure(files as Record<string, string>)
    expect(error, 'generation must fail').toBeInstanceOf(Error)
    expect(error!.message).toContain(message)
  })
})

describe('MChip', () => {
  it('reads the chip fixture into one model from TSX and from Vue', async () => {
    const { swift, vue: web, native } = await bothFormats('chip', 'Topics')
    for (const output of [web, native]) {
      const view = output.get('Topics.vue')!
      expect(view).toContain(
        '<MChip id="design" label="Design" :selectable="true" :modelValue="state.design" @update:modelValue="(value) => state.design = value" />',
      )
      expect(view).toContain('<MChip id="plain" label="Read only" icon="lock" />')
      expect(view).toContain(
        '<MChip id="pinned" label="Pinned" :removable="true" removeLabel="Unpin" @remove="() => state.pinned = false" />',
      )
    }
    const view = swift.get('Topics.swift')!
    expect(view).toMatch(
      /MavisChip\(label: "Design", selectable: true, selected: self\.design, onChange: \{ \(value: Bool\) in\n\s+self\.design = value\n\s+\}\)\n\s+\.mavisIdentifier\("design"\)\n\s+\.mavisItem\(align: \.start\)/,
    )
    expect(view).toContain(
      'MavisChip(label: "Motion", glyph: "\\u{e412}", tone: .accent, selectable: true, selected: self.motion, onChange: {',
    )
    expect(view).toMatch(
      /MavisChip\(label: "Pinned", removable: true, removeLabel: "Unpin", onRemove: \{\n\s+self\.pinned = false\n\s+\}\)/,
    )
    expect(view).toMatch(
      /\}, removable: true, removeLabel: "Remove Locked", onRemove: \{\n\s+self\.locked = false\n\s+\}, disabled: true\)/,
    )
    // A chip with a width takes it; any other is as wide as its content.
    expect(view).toMatch(
      /\}, fill: true\)\n\s+\.mavisIdentifier\("wide"\)\n\s+\.mavisItem\(width: \.points\(200\.0\), align: \.start\)/,
    )
  })

  it('presses through Jolt and draws its state from the theme', async () => {
    const { swift } = await compile({
      'Home.lite.tsx': tsx(
        "    <MRow>\n      <MChip label=\"Tag\" icon={state.on ? 'star' : 'circle'} grow={1} />\n    </MRow>",
      ),
    })
    expect(swift.get('Home.swift')).toMatch(
      /MavisChip\(label: "Tag", glyph: MavisIcons\.glyph\(\(self\.on \? "star" : "circle"\)\), fill: true\)\n\s+\.mavisItem\(grow: 1\.0, align: \.start\)/,
    )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisChip: View {')
    expect(controls).toContain('private var on: Bool { selectable && selected }')
    expect(controls).toContain('Button(action: { onChange(!selected) }) { content }')
    expect(controls).toContain('.accessibilityAddTraits(on ? .isSelected : [])')
    expect(controls).toContain(
      'MavisGlyphButton(glyph: "\\u{e1b2}", label: removeLabel, side: 46, tint: foreground, action: onRemove)',
    )
    expect(controls).toContain('.background(on ? tone.color : MavisTokens.border, in: Capsule())')
    expect(controls).toMatch(
      /\.compositingGroup\(\)\n\s+\.opacity\(disabled \? 0\.45 : 1\)\n\s+\.disabled\(disabled\)/,
    )
    expect(controls).toMatch(
      /struct MavisChipStyle: ButtonStyle \{[^]*?\.joltMotion\(to: configuration\.isPressed && isEnabled \? Self\.pressed : \.identity, transition: \.spring\(\.snappy\)\)/,
    )
  })

  it.each([
    [
      'a chip without a label',
      { 'Home.lite.tsx': tsx('    <MChip icon="star" />') },
      "Property 'label' is missing in type",
    ],
    [
      'a blank label',
      { 'Home.lite.tsx': tsx('    <MChip label="" />') },
      'shared/Home.lite.tsx:6:12: label is what the chip says: it cannot be blank.',
    ],
    [
      'selected on a chip that is not selectable',
      { 'Home.lite.tsx': tsx('    <MChip label="Tag" selected={state.on} />') },
      'shared/Home.lite.tsx:6:24: selected needs selectable: only a selectable chip is on or off.',
    ],
    [
      'onChange on a chip that is not selectable',
      {
        'Home.lite.tsx': tsx(
          '    <MChip label="Tag" onChange={(selected) => (state.on = selected)} />',
        ),
      },
      'shared/Home.lite.tsx:6:24: onChange needs selectable: only a selectable chip is on or off.',
    ],
    [
      'onRemove on a chip that is not removable',
      { 'Home.lite.tsx': tsx('    <MChip label="Tag" onRemove={() => (state.on = false)} />') },
      'shared/Home.lite.tsx:6:24: onRemove needs removable: the remove button of the chip is what reports it.',
    ],
    [
      'a removable chip without a name for its button',
      {
        'Home.lite.tsx': tsx(
          '    <MChip label="Tag" removable onRemove={() => (state.on = false)} />',
        ),
      },
      'shared/Home.lite.tsx:6:24: A removable chip needs removeLabel: what its remove button is called, such as "Remove Design".',
    ],
    [
      'a blank removeLabel',
      { 'Home.lite.tsx': tsx('    <MChip label="Tag" removable removeLabel=" " />') },
      'shared/Home.lite.tsx:6:34: removeLabel names the remove button: it cannot be blank.',
    ],
    [
      'a handler that takes text',
      {
        'Home.lite.tsx': tsx(
          '    <MChip label="Tag" selectable onChange={(selected: string) => (state.on = false)} />',
        ),
      },
      'shared/Home.lite.tsx:6:35:',
    ],
    [
      'a chip inside a card that is one button',
      {
        'Home.lite.tsx': tsx(
          '    <MCard label="Open" onClick={() => (state.on = true)}>\n      <MChip label="Tag" />\n    </MCard>',
        ),
      },
      'shared/Home.lite.tsx:6:5: A card with onClick shows text only; put buttons and fields outside it.',
    ],
    [
      'v-model on a chip that is not selectable',
      {
        'Home.vue': vue(
          "import { ref } from 'vue'\nimport { MChip } from '#mavis'\nconst on = ref(false)",
          '  <MChip label="Tag" v-model="on" />',
        ),
      },
      'shared/Home.vue:8:22: selected needs selectable: only a selectable chip is on or off.',
    ],
    [
      'a removable chip without a name for its button in Vue',
      {
        'Home.vue': vue(
          "import { MChip } from '#mavis'\nfunction drop() {}",
          '  <MChip label="Tag" removable @remove="drop" />',
        ),
      },
      'shared/Home.vue:7:22: A removable chip needs removeLabel:',
    ],
    [
      'content inside a chip in Vue',
      { 'Home.vue': vue("import { MChip } from '#mavis'", '  <MChip label="Tag">x</MChip>') },
      'shared/Home.vue:6:3: MChip takes no children; use its properties.',
    ],
  ])('fails on %s', async (_name, files, message) => {
    const error = await failure(files as Record<string, string>)
    expect(error, 'generation must fail').toBeInstanceOf(Error)
    expect(error!.message).toContain(message)
  })
})

describe('MTooltip', () => {
  it('reads the tooltip fixture into one model from TSX and from Vue', async () => {
    const { swift, vue: web, native } = await bothFormats('tooltip', 'Metrics')
    for (const output of [web, native]) {
      const view = output.get('Metrics.vue')!
      expect(view).toContain(
        '<MTooltip id="revenue-help" triggerLabel="About revenue" text="Paid invoices, before refunds." icon="circle-question-mark" variant="secondary" placement="bottom-end" :disabled="state.locked" />',
      )
      expect(view).toMatch(
        /<MTooltip id="active-help" triggerLabel="About active members" :text="\(state\.detailed \? /,
      )
    }
    const view = swift.get('Metrics.swift')!
    expect(view).toMatch(
      /MavisTooltip\(text: \(self\.detailed \? "Members who opened the app in the last seven days, counted once\." : "Active in the last seven days\."\), triggerLabel: "About active members", id: "active-help"\)\n\s+\.mavisItem\(align: \.start\)/,
    )
    expect(view).toContain(
      'MavisTooltip(text: "Paid invoices, before refunds.", triggerLabel: "About revenue", glyph: "\\u{e082}", variant: .secondary, disabled: self.locked, placement: .bottomEnd, id: "revenue-help")',
    )
  })

  it('shows its help on the feedback layer over the window, through Jolt', async () => {
    const { swift } = await compile({
      'Home.lite.tsx': tsx(
        '    <MTooltip text="Help" triggerLabel="About" delay={state.count} placement={state.on ? \'top-end\' : \'bottom-start\'} />',
      ),
    })
    expect(swift.get('Home.swift')).toContain(
      'MavisTooltip(text: "Help", triggerLabel: "About", delay: self.count, placement: MavisTooltipPlacement((self.on ? "top-end" : "bottom-start")))',
    )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisTooltip: View {')
    expect(controls).toContain('var glyph: String = "\\u{e0f9}"')
    expect(controls).toContain(
      '.anchorPreference(key: MavisTooltipKey.self, value: .bounds) { anchor in',
    )
    // placePopover of the Mavis core, and the transition of Mavis Web's popups.
    expect(controls).toContain(
      'case bottomStart = "bottom-start", bottomEnd = "bottom-end", topStart = "top-start", topEnd = "top-end"',
    )
    expect(controls).toContain('let gap = 8.0, margin = 8.0')
    expect(controls).toContain(
      'ProposedViewSize(width: max(0, min(300, bounds.width - 2 * margin)), height: nil)',
    )
    expect(controls).toContain(
      'JoltPreset.fadeInUp.recipe(try! JoltPresetParameters(distance: 3, duration: 180))',
    )
    expect(controls).toContain(
      'JoltPresence(item.open, enter: MavisTooltipHelp.enter, leave: MavisTooltipHelp.leave) {',
    )
    expect(controls).toContain(
      '.background(MavisTokens.text, in: RoundedRectangle(cornerRadius: 16))',
    )
    expect(controls).toContain(
      'func mavisFeedbackLayer() -> some View { modifier(MavisFeedbackLayer()) }',
    )
  })

  it('gives the starter and the conformance hosts the feedback layer at the root of the window', async () => {
    const { readFile } = await import('node:fs/promises')
    const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8')
    expect(
      await read('../packages/create-mavis/templates/macos/native/Sources/MavisDesktop/App.swift'),
    ).toMatch(/MavisEntry\(\)\n(\s+(\/\/.*|\.mavisLayers\(\))\n)+\s+\.mavisFeedbackLayer\(\)/)
    const harness = await read('../scripts/check-portable-conformance.mjs')
    expect(harness.match(/\.mavisFeedbackLayer\(\)/g)).toHaveLength(2)
  })

  it.each([
    [
      'a tooltip without help',
      { 'Home.lite.tsx': tsx('    <MTooltip triggerLabel="About" />') },
      "Property 'text' is missing in type",
    ],
    [
      'a tooltip whose button has no name',
      { 'Home.lite.tsx': tsx('    <MTooltip text="Help" />') },
      "Property 'triggerLabel' is missing in type",
    ],
    [
      'blank help',
      { 'Home.lite.tsx': tsx('    <MTooltip text=" " triggerLabel="About" />') },
      'shared/Home.lite.tsx:6:15: text is the help the tooltip shows: it cannot be blank.',
    ],
    [
      'a blank triggerLabel',
      { 'Home.lite.tsx': tsx('    <MTooltip text="Help" triggerLabel="" />') },
      'shared/Home.lite.tsx:6:27: triggerLabel names the button that shows the help: it cannot be blank.',
    ],
    [
      'a negative delay',
      { 'Home.lite.tsx': tsx('    <MTooltip text="Help" triggerLabel="About" delay={-1} />') },
      'shared/Home.lite.tsx:6:48: delay cannot be negative.',
    ],
    [
      'a placement the contract does not have',
      {
        'Home.lite.tsx': tsx('    <MTooltip text="Help" triggerLabel="About" placement="left" />'),
      },
      'shared/Home.lite.tsx:6:48: Type \'"left"\' is not assignable',
    ],
    [
      'content inside a tooltip',
      {
        'Home.lite.tsx': tsx(
          '    <MTooltip text="Help" triggerLabel="About">\n      <MText>x</MText>\n    </MTooltip>',
        ),
      },
      "Property 'children' does not exist",
    ],
    [
      'a tooltip without a name for its button in Vue',
      { 'Home.vue': vue("import { MTooltip } from '#mavis'", '  <MTooltip text="Help" />') },
      'shared/Home.vue:6:3: MTooltip needs triggerLabel.',
    ],
    [
      'content inside a tooltip in Vue',
      {
        'Home.vue': vue(
          "import { MText, MTooltip } from '#mavis'",
          '  <MTooltip text="Help" triggerLabel="About"><MText>x</MText></MTooltip>',
        ),
      },
      'shared/Home.vue:6:3: MTooltip takes no children; use its properties.',
    ],
  ])('fails on %s', async (_name, files, message) => {
    const error = await failure(files as Record<string, string>)
    expect(error, 'generation must fail').toBeInstanceOf(Error)
    expect(error!.message).toContain(message)
  })
})

describe('MToast and useToast', () => {
  const screen = (before: string, view: string) =>
    `import { Show, useStore } from '@builder.io/mitosis'\n\nexport default function Home() {\n${before}  const state = useStore({ on: false, count: 3 })\n  return (\n    <MColumn>\n${view}\n    </MColumn>\n  )\n}\n`
  const queue = '  const toast = useToast()\n'
  const host = '      <MToast controller={toast} />'

  it('reads the toast fixture into one model from TSX and from Vue', async () => {
    const { swift, vue: web, native } = await bothFormats('toast', 'Drafts')
    for (const output of [web, native]) {
      const view = output.get('Drafts.vue')!
      expect(view).toContain("import { useToast } from '@getcortexlabs/mavis-core/vue'")
      expect(view).toContain('const toast = useToast()')
      expect(view).not.toContain('const toast = ref')
      expect(view).toContain(
        "toast.show({ message: `Version ${state.saved} is safe.`, title: 'Draft saved', tone: state.tone })",
      )
      expect(view).toContain(
        `<MButton text="Hint" variant="secondary" @click="() => toast.show({ message: 'Drafts save as you type.', duration: 400 })" />`,
      )
      expect(view).toContain('@click="() => toast.dismiss()"')
      expect(view).toContain('@click="() => toast.clear()"')
      expect(view).toContain('<MToast :controller="toast" closeLabel="Close message" />')
    }
    const view = swift.get('Drafts.swift')!
    expect(view).toContain('@StateObject private var toast = MavisToastQueue()')
    expect(view).toContain(
      'self.toast.show(message: "Version \\(mavisString(self.saved)) is safe.", title: "Draft saved", tone: self.tone)',
    )
    expect(view).toContain(
      'self.toast.show(message: "The upload did not finish.", tone: "error", duration: 0.0)',
    )
    expect(view).toContain('self.toast.dismiss()')
    expect(view).toContain('self.toast.clear()')
    // The toast is drawn over the window: where it is written shows nothing, and the screen's
    // root hands its queue to the feedback layer.
    expect(view).toContain('.mavisToast(self.toast, closeLabel: "Close message")')
    expect(view).toContain('context.toast.dispose()')
  })

  it('keeps one queue for the screen and shows it on the feedback layer, through Jolt', async () => {
    const { swift } = await compile({
      'Home.lite.tsx': screen(
        "  const toast = useToast({ scope: 'local' })\n",
        `      <MButton text="Go" onClick={() => toast.show({ duration: state.count, message: state.on ? 'On' : 'Off' })} />\n${host}`,
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain(
      'self.toast.show(message: (self.on ? "On" : "Off"), duration: self.count)',
    )
    expect(view).toMatch(/\n {12}\.mavisToast\(self\.toast\)\n/)
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('@MainActor final class MavisToastQueue: ObservableObject {')
    expect(controls).toContain(
      'func show(message: String, title: String? = nil, tone: String? = nil, duration: Double? = nil) -> Double? {',
    )
    // The queue of the Mavis core: 5000 ms unless the toast says otherwise, one at a time.
    expect(controls).toContain('let time = duration ?? 5000')
    expect(controls).toContain('if items.count == 1 { advance() }')
    expect(controls).toContain('case success, error, warning, info')
    expect(controls).toContain(
      'func mavisToast(_ queue: MavisToastQueue, closeLabel: String = "Dismiss notification", enabled: Bool = true) -> some View {',
    )
    expect(controls).toContain('transformPreference(MavisToastKey.self)')
    expect(controls).toContain(
      'JoltPreset.fadeInDown.recipe(try! JoltPresetParameters(distance: 8, duration: 180))',
    )
    expect(controls).toContain(
      'JoltPreset.fadeOutUp.recipe(try! JoltPresetParameters(distance: 4, duration: 120))',
    )
    expect(controls).toContain('.overlayPreferenceValue(MavisToastKey.self')
  })

  it('accepts a toast shown from a function of a Vue file', async () => {
    const { vue: web, swift } = await compile({
      'Home.vue': vue(
        "import { MButton, MColumn, MToast, useToast, type ToastOptions } from '#mavis'\nconst toast = useToast()\nfunction go() {\n  toast.show({ message: 'Hi', title: 'Yo' })\n}",
        '  <MColumn><MButton text="Go" @click="go" /><m-toast :controller="toast" /></MColumn>',
      ),
    })
    expect(web.size).toBe(0)
    expect(swift.get('Home.swift')).toContain('self.toast.show(message: "Hi", title: "Yo")')
  })

  it.each([
    ['toastApp', 'Home'],
    ['toastPolicy', 'Policy'],
  ])('compiles %s into equivalent source models', async (fixture, root) => {
    await bothFormats(fixture, root)
  })

  it('owns the app queue at the entry and automatically hosts it in each screen', async () => {
    const { swift, vue: web } = await compile({
      'Home.lite.tsx': `export default function Home() {
        const toast = useToast({ scope: 'app' })
        return <MScreen><MButton text="Save" onClick={() => { const id = toast.show({ message: 'Saved', duration: 0 }); toast.dismiss(id) }} /></MScreen>
      }`,
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain('@Environment(\\.mavisApplicationToast)')
    expect(view).toContain('self.toast.request()')
    expect(view).toContain('let id: Double? = self.toast.show(message: "Saved", duration: 0.0)')
    expect(view).toContain('self.toast.dismiss(id)')
    expect(view).not.toContain('context.toast.dispose()')
    expect(web.get('Home.vue')).toContain("const toast = useToast({ scope: 'app' })")
    expect(web.get('Home.vue')).toContain('toast.dismiss(id)')
    expect(swift.get('MavisControls.swift')!.includes('private struct MavisAppToastScope')).toBe(
      true,
    )
  })

  it('returns a toast id to authored Vue without exposing the controller lifetime owner', async () => {
    const { swift } = await compile({
      'Home.vue': vue(
        "import { useToast } from '#mavis'\nconst toast = useToast()\nfunction show() { const id = toast.show({ message: 'Saved' }); toast.dismiss(id) }",
        '<MColumn><MButton text="Save" @click="show" /><MToast :controller="toast" /></MColumn>',
      ),
    })
    expect(swift.get('Home.swift')).toContain('let id: Double? = self.toast.show(message: "Saved")')
    expect(swift.get('Home.swift')).toContain('context.toast.dispose()')
  })

  it.each([
    [
      'a queue nothing shows',
      {
        'Home.lite.tsx': screen(
          queue,
          '      <MButton text="Go" onClick={() => toast.show({ message: \'Hi\' })} />',
        ),
      },
      'shared/Home.lite.tsx:4:9: toast is not shown anywhere: add an MToast with toast as its controller to this component.',
    ],
    [
      'a queue nothing shows in Vue',
      {
        'Home.vue': vue(
          "import { MButton, MColumn, useToast } from '#mavis'\nconst toast = useToast()",
          '  <MColumn><MButton text="Go" @click="toast.clear()" /></MColumn>',
        ),
      },
      'shared/Home.vue:3:7: toast is not shown anywhere: add an MToast with toast as its controller to this component.',
    ],
    [
      'an MToast without its queue',
      { 'Home.lite.tsx': screen('', '      <MToast closeLabel="Close" />') },
      "Property 'controller' is missing in type",
    ],
    [
      'an MToast without its queue in Vue',
      {
        'Home.vue': vue(
          "import { MColumn, MToast } from '#mavis'",
          '  <MColumn><MToast closeLabel="x" /></MColumn>',
        ),
      },
      'shared/Home.vue:6:12: MToast needs controller.',
    ],
    [
      'a controller that is not a queue',
      { 'Home.lite.tsx': screen('', '      <MToast controller={state.count} />') },
      "Type 'number' is not assignable to type 'MavisToast'.",
    ],
    [
      'an MToast inside Show',
      {
        'Home.lite.tsx': screen(queue, `      <Show when={state.on}>\n  ${host}\n      </Show>`),
      },
      'An MToast stays on the screen: put it outside Show and For. Its queue decides what shows.',
    ],
    [
      'an MToast under v-if',
      {
        'Home.vue': vue(
          "import { ref } from 'vue'\nimport { MColumn, MToast, useToast } from '#mavis'\nconst toast = useToast()\nconst on = ref(true)",
          '  <MColumn><MToast v-if="on" :controller="toast" /></MColumn>',
        ),
      },
      'An MToast stays on the screen: put it outside Show and For.',
    ],
    [
      'two MToasts for one queue',
      { 'Home.lite.tsx': screen(queue, `${host}\n${host}`) },
      'shared/Home.lite.tsx:9:15: toast already has an MToast: a queue is shown in one place.',
    ],
    [
      'a blank closeLabel',
      { 'Home.lite.tsx': screen(queue, '      <MToast controller={toast} closeLabel=" " />') },
      'closeLabel names the button that dismisses a toast: it cannot be blank.',
    ],
    [
      'a toast that is only text',
      {
        'Home.lite.tsx': screen(
          queue,
          `      <MButton text="Go" onClick={() => toast.show('Hi')} />\n${host}`,
        ),
      },
      "Argument of type 'string' is not assignable to parameter of type 'MavisToastOptions'.",
    ],
    [
      'a toast without a message',
      {
        'Home.lite.tsx': screen(
          queue,
          `      <MButton text="Go" onClick={() => toast.show({ message: ' ' })} />\n${host}`,
        ),
      },
      'shared/Home.lite.tsx:8:54: message is what the toast says: it cannot be blank.',
    ],
    [
      'a negative duration',
      {
        'Home.lite.tsx': screen(
          queue,
          `      <MButton text="Go" onClick={() => toast.show({ message: 'Hi', duration: -1 })} />\n${host}`,
        ),
      },
      'shared/Home.lite.tsx:8:69: duration cannot be negative; 0 keeps the toast until it is dismissed.',
    ],
    [
      'something a toast does not have',
      {
        'Home.lite.tsx': screen(
          queue,
          `      <MButton text="Go" onClick={() => toast.show({ message: 'Hi', icon: 'x' })} />\n${host}`,
        ),
      },
      "'icon' does not exist in type 'MavisToastOptions'.",
    ],
    [
      'a method a queue does not have',
      {
        'Home.lite.tsx': screen(
          queue,
          `      <MButton text="Go" onClick={() => toast.hide()} />\n${host}`,
        ),
      },
      "Property 'hide' does not exist on type 'MavisToast'.",
    ],
  ])('fails on %s', async (_name, files, message) => {
    const error = await failure(files as Record<string, string>)
    expect(error, 'generation must fail').toBeInstanceOf(Error)
    expect(error!.message).toContain(message)
  })
})

describe('MNotificationCenter', () => {
  it('retains application metadata when generating controlled updates', async () => {
    const { swift, vue: output } = await compileProject(
      await readShared(join(portable, 'notifications')),
      { root: 'Inbox' },
    )
    const source = swift.get('Inbox.swift')!
    expect(source).toContain('stamp: item.stamp')
    expect(source).toContain('read: read')
    expect(output.get('Inbox.vue')).toContain('@update:modelValue=')
    const fromVue = await compileProject(await readShared(join(portable, 'notificationsVue')), {
      root: 'Inbox',
    })
    expect(fromVue.direct).toEqual(['shared/Inbox.vue'])
    expect(fromVue.swift.get('Inbox.swift')).toContain('stamp: item.stamp')
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('guard ids.contains(entry.id), !entry.disabled else')
    expect(controls).toContain('entry.dismissible ? nil : entry.item')
    expect(controls).toContain('.joltLayout(value: items)')
  })
})
