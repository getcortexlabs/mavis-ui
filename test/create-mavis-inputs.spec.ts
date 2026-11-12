import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { sliderScale } from '@getcortexlabs/mavis-core'
import {
  radioGroupProps,
  segmentedProps,
  sliderProps,
  switchProps,
} from '../packages/core/src/vue/props'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { components } from '../packages/create-mavis/templates/macos/scripts/portable/components/index.mjs'

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
const tsx = (view: string, state = '') =>
  `import { useStore } from '@builder.io/mitosis'\n\nexport default function Home() {\n  const state = useStore({ on: false, amount: 40, text: '', ${state} })\n  return (\n${view}\n  )\n}\n`
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
const fixture = async (name: string, root: string): Promise<Output> =>
  compileProject(await readShared(join(portable, name)), { root })
const problems = async (files: Record<string, string>) => {
  try {
    await compile(files)
  } catch (error) {
    return (error as { diagnostics: { message: string }[] }).diagnostics
      .map((item) => item.message)
      .join('\n')
  }
  return ''
}
const places = async (files: Record<string, string>) => {
  try {
    await compile(files)
  } catch (error) {
    return (
      error as { diagnostics: { file: string; line: number; column: number }[] }
    ).diagnostics.map((item) => `${item.file}:${item.line}:${item.column}`)
  }
  return []
}

describe('the form controls in both formats', () => {
  it.each([
    ['switch', 'Switches'],
    ['slider', 'Sliders'],
    ['segmented', 'Segments'],
    ['radio', 'Radios'],
  ])('reads the %s fixture into one model from TSX and from Vue', async (name, root) => {
    const fromTsx = await fixture(name, root)
    const fromVue = await fixture(`${name}Vue`, root)
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.direct).toEqual([`shared/${root}.vue`])
  })

  it('takes only properties of the published contracts', () => {
    const model = ['value', 'checked', 'onChange']
    const contracts = {
      MSwitch: [switchProps, model],
      MSlider: [sliderProps, model],
      MSegmentedControl: [segmentedProps, model],
      MRadioGroup: [radioGroupProps, model],
    } as const
    for (const [name, [contract, own]] of Object.entries(contracts)) {
      const accepted = Object.keys(components[name].props).filter(
        (prop) => !(own as readonly string[]).includes(prop),
      )
      expect(
        accepted.filter((prop) => !Object.keys(contract).includes(prop)),
        name,
      ).toEqual([])
    }
  })
})

describe('MSwitch', () => {
  it('writes the switch with its value, its event and its place in the stack', async () => {
    const { swift, vue: web, native } = await fixture('switch', 'Switches')
    const view = swift.get('Switches.swift')!
    expect(view).toMatch(
      /MavisSwitch\(\n\s+label: "Wi-Fi",\n\s+checked: self\.wifi,\n\s+onChange: \{ \(value: Bool\) in\n\s+self\.wifi = value\n\s+\}\n\s+\)/,
    )
    expect(view).toMatch(
      /label: "Sync",\n\s+checked: self\.sync,\n\s+onChange: \{ \(next: Bool\) in\n\s+self\.choose\(next\)\n\s+\},\n\s+helperText: "Keeps this Mac up to date",\n\s+id: "sync"/,
    )
    expect(view).toContain('disabled: true')
    for (const output of [web, native]) {
      const file = output.get('Switches.vue')!
      expect(file).toContain(
        '<MSwitch label="Wi-Fi" :modelValue="state.wifi" @update:modelValue="(value) => state.wifi = value" />',
      )
      expect(file).toContain(
        '<MSwitch id="sync" label="Sync" helperText="Keeps this Mac up to date" :modelValue="state.sync" @update:modelValue="(next) => state.choose(next)" />',
      )
    }
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisSwitch: View {')
    // One control from edge to edge, named by its label; the track and thumb use theme tokens.
    expect(controls).toContain('.toggleStyle(MavisSwitchStyle())')
    expect(controls).toContain('Capsule().fill(on ? MavisTokens.primary : MavisTokens.muted)')
    expect(controls).toContain('.fill(on ? MavisTokens.onPrimary : MavisTokens.surface)')
    expect(controls).toContain('.joltLayout(value: on, transition: MavisChoiceMotion.paint)')
    expect(controls).toContain(
      'static let paint: JoltTransition = try! .tween(milliseconds: 180, ease: .easeOut)',
    )
  })

  it('takes grow, shrink and width like the other children of a stack', async () => {
    const { swift } = await compile({
      'Home.lite.tsx': tsx(
        '    <MRow>\n      <MSwitch label="Wide" checked={state.on} onChange={(value) => (state.on = value)} grow={1} width="50%" accessibilityHidden />\n    </MRow>',
      ),
    })
    expect(swift.get('Home.swift')).toMatch(
      /\)\n\s+\.accessibilityHidden\(true\)\n\s+\.mavisItem\(grow: 1\.0, width: \.fraction\(0\.5\)\)/,
    )
  })

  it.each([
    ['<MSwitch checked={state.on} onChange={(value) => (state.on = value)} />', /label/],
    ['<MSwitch label="Wi-Fi" onChange={(value) => (state.on = value)} />', /checked/],
    ['<MSwitch label="Wi-Fi" checked={state.on} />', /onChange/],
    [
      '<MSwitch label="Wi-Fi" checked={state.amount} onChange={(value) => (state.on = value)} />',
      /not assignable/,
    ],
    [
      '<MSwitch label="Wi-Fi" checked={state.on} onChange={(value) => (state.amount = value)} />',
      /not assignable/,
    ],
    [
      '<MSwitch label="Wi-Fi" checked={state.on} onChange={(value) => (state.on = value)} tone="primary" />',
      /tone/,
    ],
  ])('rejects %s', async (view, message) => {
    expect(await problems({ 'Home.lite.tsx': tsx(`    ${view}`) })).toMatch(message)
  })

  it('names what a Vue file is missing in its own words', async () => {
    const file = {
      'Home.vue': vue(
        "import { ref } from 'vue'\nconst on = ref(false)",
        '  <MSwitch v-model="on" />',
      ),
    }
    expect(await problems(file)).toMatch(/MSwitch needs label/)
    expect(await places(file)).toEqual(['shared/Home.vue:7:3'])
    expect(
      await problems({
        'Home.vue': vue(
          "import { ref } from 'vue'\nconst on = ref(false)",
          '  <MSwitch label="Wi-Fi" />',
        ),
      }),
    ).toMatch(/MSwitch needs v-model/)
  })
})

describe('MSlider', () => {
  it('writes the range in the order of the Swift initializer and v-model in Vue', async () => {
    const { swift, vue: web, native } = await fixture('slider', 'Sliders')
    const view = swift.get('Sliders.swift')!
    expect(view).toMatch(
      /MavisSlider\(\n\s+label: "Level",\n\s+value: self\.level,\n\s+onChange: \{ \(value: Double\) in\n\s+self\.level = value\n\s+\},\n\s+minimum: 0\.0,\n\s+maximum: 10\.0,\n\s+step: 3\.0\n\s+\)/,
    )
    expect(view).toMatch(/maximum: 50\.0,\n\s+disabled: true\n/)
    expect(view).toContain('id: "volume"')
    for (const output of [web, native])
      expect(output.get('Sliders.vue')).toContain(
        '<MSlider label="Level" :modelValue="state.level" @update:modelValue="(value) => state.level = value" :min="0" :max="10" :step="3" />',
      )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisSliderScale {')
    expect(controls).toContain('struct MavisSlider: View {')
    expect(controls).toContain('Capsule().fill(MavisTokens.muted).frame(height: 6)')
    expect(controls).toContain(
      'Slider(value: Binding(get: { index }, set: { ask($0) }), in: 0...scale.steps, step: 1) {',
    )
  })

  // The Swift scale is the core's, line for line; these are the cases its comments name.
  it('steps like sliderScale in the core, with a shorter last step', () => {
    const scale = sliderScale(0, 10, 3)
    expect(scale.steps).toBe(4)
    expect([0, 1, 2, 3, 4].map((index) => scale.fromNative(index))).toEqual([0, 3, 6, 9, 10])
    expect([9.4, 9.5, 10].map((value) => scale.toNative(value))).toEqual([3, 4, 4])
    expect(sliderScale(0, 1, 0.1).fromNative(3)).toBe(0.3)
  })

  it.each([
    ['min={60} max={50}', /min is below max/],
    ['min={100}', /min is below max/],
    ['step={0}', /step must be positive/],
    ['step={-2}', /step must be positive/],
    ['value="high"', /not assignable/],
    ['orientation="vertical"', /orientation/],
  ])('rejects %s', async (props, message) => {
    expect(
      await problems({
        'Home.lite.tsx': tsx(
          `    <MSlider label="Volume" value={state.amount} onChange={(value) => (state.amount = value)} ${props} />`,
        ),
      }),
    ).toMatch(message)
  })

  it('hands its event a number', async () => {
    expect(
      await problems({
        'Home.vue': vue(
          "import { ref } from 'vue'\nconst text = ref('')",
          '  <MSlider label="Volume" :model-value="40" @update:model-value="(value: string) => (text = value)" />',
        ),
      }),
    ).toMatch(/not assignable/)
  })
})

const choice = (tag: string, props: string) =>
  tsx(
    `    <${tag} label="View" ${props} />`,
    "view: 'week' as string | undefined, views: [{ value: 'day', label: 'Day' }] as SegmentedOption[], names: ['day'] as string[]",
  )

describe('MSegmentedControl', () => {
  it('writes the options as choices and the marker that Jolt moves', async () => {
    const { swift, vue: web, native } = await fixture('segmented', 'Segments')
    const view = swift.get('Segments.swift')!
    expect(view).toMatch(
      /MavisSegmentedControl\(\n\s+label: "Calendar view",\n\s+options: self\.views\.map \{ option in MavisChoice\(value: option\.value, label: option\.label, disabled: option\.disabled \?\? false, helperText: option\.helperText \?\? ""\) \},\n\s+value: self\.view,\n\s+onChange: \{ \(next: String\) in\n\s+self\.pick\(next\)\n\s+\}\n\s+\)\n\s+\.mavisIdentifier\("views"\)/,
    )
    expect(view).toMatch(
      /\.mavisItem\(width: \.points\(240\.0\)\)\n\s+\.mavisIdentifier\("sizes"\)/,
    )
    expect(view).toContain('value: "auto",')
    for (const output of [web, native]) {
      const file = output.get('Segments.vue')!
      // The Web and NativeScript take null for no choice and report strings or numbers.
      expect(file).toContain(
        '<MSegmentedControl id="views" label="Calendar view" :options="state.views" :modelValue="state.view ?? null" @update:modelValue="(choice) => ((next) => state.pick(next))(String(choice))" />',
      )
      expect(file).toContain(':modelValue="\'auto\' ?? null"')
    }
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisSegmentedControl: View {')
    expect(controls).toContain(
      'private static let slide: JoltTransition = try! .tween(milliseconds: 180, ease: .easeOut)',
    )
    expect(controls).toContain('.joltLayout(value: index, transition: Self.slide)')
    expect(controls).toContain('.fill(MavisTokens.primarySoft)')
    expect(controls).toContain('func mavisChoiceTarget(')
    const types = swift.get('MavisTypes.swift')!
    expect(types).toMatch(
      /struct SelectOption: Hashable \{\n\s+var value: String\n\s+var label: String\n\s+var helperText: String\?\n\s+var disabled: Bool\?\n/,
    )
  })

  it.each([
    ['options={state.views} onChange={(value) => (state.view = value)}', /'value' is missing/],
    ['options={state.views} value={state.view}', /'onChange' is missing/],
    ['value={state.view} onChange={(value) => (state.view = value)}', /'options' is missing/],
    [
      'options={state.names} value={state.view} onChange={(value) => (state.view = value)}',
      /not assignable/,
    ],
    [
      'options={state.views} value={state.amount} onChange={(value) => (state.view = value)}',
      /not assignable/,
    ],
    [
      'options={state.views} value={state.view} onChange={(value) => (state.amount = value)}',
      /not assignable/,
    ],
    [
      'options={state.views} value={state.view} onChange={(value) => (state.view = value)} helperText="No"',
      /helperText/,
    ],
  ])('rejects %s', async (props, message) => {
    expect(await problems({ 'Home.lite.tsx': choice('MSegmentedControl', props) })).toMatch(message)
  })
})

describe('MRadioGroup', () => {
  it('writes the group with its helper text and each option with its own', async () => {
    const { swift, vue: web, native } = await fixture('radio', 'Radios')
    const view = swift.get('Radios.swift')!
    expect(view).toMatch(
      /MavisRadioGroup\(\n\s+label: "Plan",\n\s+options: self\.plans\.map \{ option in MavisChoice\([^\n]+\) \},\n\s+value: self\.plan,\n\s+onChange: \{ \(value: String\) in\n\s+self\.plan = value\n\s+\},\n\s+helperText: "You can change it later"\n\s+\)\n\s+\.mavisIdentifier\("plans"\)/,
    )
    expect(view).toMatch(/value: "eu",[\s\S]*?disabled: true\n/)
    for (const output of [web, native])
      expect(output.get('Radios.vue')).toContain(
        '<MRadioGroup id="plans" label="Plan" helperText="You can change it later" :options="state.plans" :modelValue="state.plan ?? null" @update:modelValue="(choice) => ((value) => state.plan = value)(String(choice))" />',
      )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisRadioGroup: View {')
    expect(controls).toContain('var helperText: String = ""\n}')
    expect(controls).toContain(
      'Circle().inset(by: 1).stroke(on ? MavisTokens.primary : MavisTokens.muted, lineWidth: 2)',
    )
    expect(controls).toContain('if !option.helperText.isEmpty {')
  })

  it('reads ChoiceOption with a helper text in both formats', async () => {
    const fromVue = await compile({
      'Home.vue': vue(
        "import { ref } from 'vue'\nimport type { ChoiceOption } from '@getcortexlabs/mavis-core'\nconst plan = ref<string | null>(null)\nconst plans: ChoiceOption[] = [{ value: 'free', label: 'Free', helperText: 'One project' }]",
        '  <MRadioGroup v-model="plan" label="Plan" :options="plans" />',
      ),
    })
    expect(fromVue.swift.get('Home.swift')).toContain(
      'SelectOption(value: "free", label: "Free", helperText: "One project", disabled: nil)',
    )
  })

  it.each([
    ['options={state.views} onChange={(value) => (state.view = value)}', /'value' is missing/],
    ['options={state.views} value={state.view}', /'onChange' is missing/],
    [
      'options={state.names} value={state.view} onChange={(value) => (state.view = value)}',
      /not assignable/,
    ],
    [
      'options={state.views} value={state.view} onChange={(value) => (state.on = value)}',
      /not assignable/,
    ],
    [
      'options={state.views} value={state.view} onChange={(value) => (state.view = value)} error="No"',
      /error/,
    ],
  ])('rejects %s', async (props, message) => {
    expect(await problems({ 'Home.lite.tsx': choice('MRadioGroup', props) })).toMatch(message)
  })

  it('needs a ref that can hold a choice for v-model', async () => {
    expect(
      await problems({
        'Home.vue': vue(
          "import { ref } from 'vue'\nimport type { ChoiceOption } from '#mavis'\nconst plan = ref(0)\nconst plans: ChoiceOption[] = []",
          '  <MRadioGroup v-model="plan" label="Plan" :options="plans" />',
        ),
      }),
    ).toMatch(/not assignable/)
  })
})
