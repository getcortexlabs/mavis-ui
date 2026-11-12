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
  expect(fromVue.direct).toEqual([`shared/${root}.vue`])
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
    expect(controls).toContain('struct MavisFitted: Layout {')
    expect(controls).toContain(
      'self == .primary ? MavisTokens.primarySoft : self == .accent ? MavisTokens.accentSoft : MavisTokens.elevated',
    )
    expect(controls).toContain('.background(tone.background, in: Capsule())')
    expect(controls).not.toMatch(/MavisBadge[^]*Color\(red:/)
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
      'MavisIconButton(glyph: "\\u{e1b2}", label: closeLabel, action: onClose)',
    )
    expect(controls).toContain('.strokeBorder(tone.color, lineWidth: 1)')
    expect(controls).toContain('if Actions.self != EmptyView.self {')
    expect(controls).toContain('struct MavisIconButton: View {')
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
