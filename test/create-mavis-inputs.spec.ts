import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { sliderScale } from '@getcortexlabs/mavis-core'
import { numberInputProps } from '../packages/core/src/vue/configurator-props'
import { rangeSliderProps, ratingProps } from '../packages/core/src/vue/discovery-props'
import { pinInputProps } from '../packages/core/src/vue/screen-component-props'
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
  it('keeps published text input modes, action ownership and explicit field widths', async () => {
    const { swift, vue: web, native } = await fixture('basicInputs', 'BasicInputs')
    for (const output of [web, native]) {
      expect(output.get('BasicInputs.vue')).toContain('type="search"')
      expect(output.get('BasicInputs.vue')).toContain('type="url"')
      expect(output.get('BasicInputs.vue')).toContain('type="tel"')
      expect(output.get('BasicInputs.vue')).toContain('@action="() => state.clear()"')
    }
    const screen = swift.get('BasicInputs.swift')!
    expect(screen.match(/email: true/g)).toHaveLength(2)
    expect(screen.match(/\.mavisItem\(width: \.points\(320\.0\)\)/g)).toHaveLength(3)
    expect(screen).toContain(
      'MavisInputAccessory(icon: action.icon, label: action.label, disabled: action.disabled ?? false)',
    )
    const runtime = swift.get('MavisControls.swift')!
    expect(runtime).toContain('guard !disabled && !readonly && !action.disabled else { return }')
    expect(runtime).toContain('.buttonStyle(MavisButtonStyle(variant: .ghost, iconOnly: true))')
    const select = await compile({
      'Home.lite.tsx': tsx(
        '<MSelect label="Size" value={state.text} options={[{ value: "a", label: "A" }]} onChange={value => { state.text = value }} width={280} />',
      ),
    })
    expect(select.swift.get('Home.swift')).toContain('.mavisItem(width: .points(280.0))')
  })

  it('rejects competing input trailing adornments and invalid multiline modes', async () => {
    expect(
      await problems({
        'Home.lite.tsx': tsx(
          '<MInput label="Search" value={state.text} onChange={value => { state.text = value }} trailingIcon="search" trailingAction={{ icon: "x", label: "Clear" }} />',
        ),
      }),
    ).toContain('Use either trailingIcon or trailingAction')
    expect(
      await problems({
        'Home.lite.tsx': tsx(
          '<MInput label="Search" value={state.text} onChange={value => { state.text = value }} multiline type="search" />',
        ),
      }),
    ).toContain('always type="text"')
  })
  it.each([
    ['basicInputs', 'BasicInputs'],
    ['switch', 'Switches'],
    ['slider', 'Sliders'],
    ['segmented', 'Segments'],
    ['radio', 'Radios'],
    ['number', 'Counts'],
    ['numberDraft', 'Draft'],
    ['range', 'Ranges'],
    ['rating', 'Ratings'],
    ['pin', 'Codes'],
    ['pinType', 'Entry'],
  ])('reads the %s fixture into one model from TSX and from Vue', async (name, root) => {
    const fromTsx = await fixture(name, root)
    const fromVue = await fixture(`${name}Vue`, root)
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.direct).toEqual([`shared/${root}.vue`])
  })

  it('takes only properties of the published contracts', () => {
    const model = ['value', 'checked', 'onChange', 'ref']
    const events = ['onDraftChange', 'onFocus', 'onBlur', 'onValidityChange', 'onComplete']
    const contracts = {
      MSwitch: [switchProps, model],
      MSlider: [sliderProps, model],
      MSegmentedControl: [segmentedProps, model],
      MRadioGroup: [radioGroupProps, model],
      MNumberInput: [numberInputProps, [...model, ...events]],
      MRangeSlider: [rangeSliderProps, model],
      MRating: [ratingProps, model],
      MPinInput: [pinInputProps, [...model, ...events]],
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
    "view: 'week' as ChoiceValue | undefined, views: [{ value: 'day', label: 'Day' }] as SegmentedOption[], names: ['day'] as string[]",
  )

describe('MSegmentedControl', () => {
  it('writes the options as choices and the marker that Jolt moves', async () => {
    const { swift, vue: web, native } = await fixture('segmented', 'Segments')
    const view = swift.get('Segments.swift')!
    expect(view).toMatch(
      /MavisSegmentedControl\(\n\s+label: "Calendar view",\n\s+options: self\.views\.map \{ option in MavisChoice\(value: option\.value, label: option\.label, disabled: option\.disabled \?\? false, helperText: option\.helperText \?\? ""\) \},\n\s+value: self\.view,\n\s+onChange: \{ \(next: MavisChoiceValue\) in\n\s+self\.pick\(next\)\n\s+\}\n\s+\)\n\s+\.mavisIdentifier\("views"\)/,
    )
    expect(view).toMatch(
      /\.mavisItem\(width: \.points\(240\.0\)\)\n\s+\.mavisIdentifier\("sizes"\)/,
    )
    expect(view).toContain('value: MavisChoiceValue.text("auto"),')
    for (const output of [web, native]) {
      const file = output.get('Segments.vue')!
      // The Web and NativeScript take null for no choice and report strings or numbers.
      expect(file).toContain(
        '<MSegmentedControl id="views" label="Calendar view" :options="state.views" :modelValue="state.view ?? null" @update:modelValue="(choice) => ((next) => state.pick(next))(choice)" />',
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
      /struct SelectOption: Hashable \{\n\s+var value: MavisChoiceValue\n\s+var label: String\n\s+var helperText: String\?\n\s+var disabled: Bool\?\n/,
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
      'options={state.views} value={state.on} onChange={(value) => (state.view = value)}',
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
      /MavisRadioGroup\(\n\s+label: "Plan",\n\s+options: self\.plans\.map \{ option in MavisChoice\([^\n]+\) \},\n\s+value: self\.plan,\n\s+onChange: \{ \(value: MavisChoiceValue\) in\n\s+self\.plan = value\n\s+\},\n\s+helperText: "You can change it later"\n\s+\)\n\s+\.mavisIdentifier\("plans"\)/,
    )
    expect(view).toMatch(/value: MavisChoiceValue\.text\("eu"\),[\s\S]*?disabled: true\n/)
    for (const output of [web, native])
      expect(output.get('Radios.vue')).toContain(
        '<MRadioGroup id="plans" label="Plan" helperText="You can change it later" :options="state.plans" :modelValue="state.plan ?? null" @update:modelValue="(choice) => ((value) => state.plan = value)(choice)" />',
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
        "import { ref } from 'vue'\nimport type { ChoiceOption } from '@getcortexlabs/mavis-core'\nconst plan = ref<string | number | null>(null)\nconst plans: ChoiceOption[] = [{ value: 'free', label: 'Free', helperText: 'One project' }]",
        '  <MRadioGroup v-model="plan" label="Plan" :options="plans" />',
      ),
    })
    expect(fromVue.swift.get('Home.swift')).toContain(
      'SelectOption(value: MavisChoiceValue.text("free"), label: "Free", helperText: "One project", disabled: nil)',
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

const count = (props: string) =>
  tsx(`    <MNumberInput label="Count" ${props} />`, "count: 2 as number | undefined, draft: '2'")
const counted = 'value={state.count} onChange={(value) => (state.count = value)}'

describe('MNumberInput', () => {
  it('writes the value that may be missing, its bounds and the labels of its buttons', async () => {
    const { swift, vue: web, native } = await fixture('number', 'Counts')
    const view = swift.get('Counts.swift')!
    expect(view).toMatch(
      /MavisNumberInput\(\n\s+label: "Quantity",\n\s+value: self\.quantity,\n\s+onChange: \{ \(value: Double\?\) in\n\s+self\.quantity = value\n\s+\},\n\s+focus: \$mavisFocus,\n\s+focusKey: "number1",\n\s+minimum: 0\.0,\n\s+maximum: 4\.0,\n\s+helperText: "Up to four",\n\s+id: "quantity"\n\s+\)/,
    )
    expect(view).toMatch(
      /step: 0\.25,\n\s+locale: "pt-BR",\n\s+incrementLabel: "Aumentar",\n\s+decrementLabel: "Diminuir"/,
    )
    expect(view).toContain('@State private var quantity: Double?')
    expect(view).toContain('guard let next else { return }')
    for (const output of [web, native])
      // The Web and NativeScript write null for no value; the source writes undefined.
      expect(output.get('Counts.vue')).toContain(
        '<MNumberInput id="quantity" label="Quantity" :modelValue="state.quantity ?? null" @update:modelValue="(next) => ((value) => state.quantity = value)(next ?? undefined)" :min="0" :max="4" helperText="Up to four" />',
      )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisNumberInput: View {')
    expect(controls).toContain('func mavisParseNumber(')
    expect(controls).toContain('func mavisStepNumber(')
    expect(controls).toContain('.accessibilityLabel(Text(verbatim: name + ": " + label))')
  })

  it('keeps a draft that belongs to the source and moves focus through a reference', async () => {
    const { swift, vue: web } = await fixture('numberDraft', 'Draft')
    const view = swift.get('Draft.swift')!
    expect(view).toContain('focusKey: "amountRef",')
    expect(view).toContain('self.mavisFocus = "amountRef"')
    expect(view).toMatch(
      /draft: self\.text,\n\s+onDraftChange: \{ \(value: String\) in\n\s+self\.text = value\n\s+\}/,
    )
    const file = web.get('Draft.vue')!
    expect(file).toContain('<MNumberInput ref="amountRef" label="Amount"')
    expect(file).toContain(':draft="state.text" @update:draft="(value) => state.text = value"')
  })

  it('reads null as the missing value of a Vue file', async () => {
    const { swift } = await compile({
      'Home.vue': vue(
        "import { ref } from 'vue'\nconst count = ref<number | null>(null)\nfunction set(next: number | null) {\n  count.value = next\n}",
        '  <MColumn>\n    <MNumberInput v-model="count" label="Count" />\n    <MNumberInput label="Again" :model-value="count" @update:model-value="set" />\n    <MNumberInput label="Inline" :model-value="count" @update:model-value="(next) => (count = next)" />\n  </MColumn>',
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain('_count = State(initialValue: nil)')
    expect(view).toMatch(/onChange: \{ \(value: Double\?\) in\n\s+self\.count = value\n/)
    expect(view).toMatch(/onChange: \{ \(next: Double\?\) in\n\s+self\.set\(next\)\n/)
    expect(view).toMatch(/onChange: \{ \(next: Double\?\) in\n\s+self\.count = next\n/)
  })

  it.each([
    [`${counted} step={0}`, /step must be positive/],
    [`${counted} min={5} max={1}`, /min does not exceed max/],
    [`${counted} locale="fr-FR"`, /not assignable/],
    [`${counted} onDraftChange={(value) => (state.draft = value)}`, /pass draft with it/],
    [`${counted} onValidityChange={() => (state.on = true)}`, /validityChange hands[^]*#349/],
    ['value={state.amount} onChange={(value) => (state.amount = value)}', /not assignable/],
    ['value={state.count} onChange={(value) => (state.text = value)}', /not assignable/],
    [`${counted} currency="BRL"`, /currency/],
  ])('rejects %s', async (props, message) => {
    expect(await problems({ 'Home.lite.tsx': count(props) })).toMatch(message)
  })

  it('tells a Vue file which events the Mac takes', async () => {
    const file = {
      'Home.vue': vue(
        "import { ref } from 'vue'\nconst count = ref<number | null>(null)\nconst on = ref(false)",
        '  <MNumberInput v-model="count" label="Count" @validity-change="on = true" />',
      ),
    }
    expect(await problems(file)).toMatch(
      /MNumberInput does not take @validityChange on the Mac\. It supports/,
    )
    expect(await places(file)).toEqual(['shared/Home.vue:8:47'])
    expect(
      await problems({
        'Home.vue': vue(
          "import { ref } from 'vue'\nconst count = ref(0)",
          '  <MNumberInput v-model="count" label="Count" />',
        ),
      }),
    ).toMatch(/'number \| null' is not assignable to type 'number'/)
  })
})

const span = (props: string) =>
  tsx(
    `    <MRangeSlider label="Price" ${props} />`,
    'pair: [20, 80] as [number, number], list: [20, 80] as number[]',
  )
const spanned = 'value={state.pair} onChange={(value) => (state.pair = value)}'

describe('MRangeSlider', () => {
  it('writes the pair, both thumbs and the text of the range', async () => {
    const { swift, vue: web, native } = await fixture('range', 'Ranges')
    const view = swift.get('Ranges.swift')!
    expect(view).toContain('@State private var price: [Double]')
    expect(view).toContain('_price = State(initialValue: [20.0, 80.0])')
    expect(view).toMatch(
      /MavisRangeSlider\(\n\s+label: "Price",\n\s+value: self\.price,\n\s+onChange: \{ \(value: \[Double\]\) in\n\s+self\.price = value\n\s+\},\n\s+step: 5\.0,\n\s+formatValue: \{ \(value: Double\) -> String in "\$\\\(mavisString\(value\)\)" \}\n\s+\)\n\s+\.mavisIdentifier\("price"\)/,
    )
    expect(view).toMatch(/maximum: 24\.0,\n\s+lowerLabel: "Start",\n\s+upperLabel: "End"/)
    expect(view).toMatch(/value: \[2\.0, 4\.0\],[\s\S]*?readonly: true/)
    for (const output of [web, native]) {
      const file = output.get('Ranges.vue')!
      // The Web and NativeScript take the pair as a tuple and hand it back read-only.
      expect(file).toContain(
        '<MRangeSlider id="price" label="Price" :modelValue="state.price as [number, number]" @update:modelValue="(pair) => ((value) => state.price = value)([...pair])" :step="5" :formatValue="(value) => `$${value}`" />',
      )
      expect(file).toContain('price: [20, 80] as number[],')
    }
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisRangeSlider: View {')
    expect(controls).toContain(
      'next[thumb] = thumb == 0 ? Swift.min(snapped, next[1]) : Swift.max(snapped, next[0])',
    )
    expect(controls).toContain(
      'Text(verbatim: label + ": " + (thumb == 0 ? lowerLabel : upperLabel))',
    )
    expect(controls).toContain(
      'static let feedback: JoltTransition = try! .spring(milliseconds: 216, bounce: 0.2)',
    )
  })

  it('reads a pair as a list in every target', async () => {
    const { model } = await compile({
      'Home.vue': vue(
        "import { ref } from 'vue'\nconst pair = ref<[number, number]>([1, 2])",
        '  <MRangeSlider v-model="pair" label="Pair" :format-value="(value) => `${value} km`" />',
      ),
    })
    const [home] = model.components as unknown as { state: { type: unknown }[] }[]
    expect(home!.state[0]!.type).toEqual({ k: 'array', of: { k: 'number' } })
  })

  it.each([
    [`${spanned} min={60} max={50}`, /min is below max/],
    [`${spanned} step={0}`, /step must be positive/],
    ['value={[1, 2, 3]} onChange={(value) => (state.pair = value)}', /not assignable/],
    ['value={[9, 2]} onChange={(value) => (state.pair = value)}', /the lower first/],
    ['value={state.list} onChange={(value) => (state.pair = value)}', /not assignable/],
    ['value={state.amount} onChange={(value) => (state.pair = value)}', /not assignable/],
    ['value={state.pair} onChange={(value) => (state.amount = value)}', /not assignable/],
    [`${spanned} formatValue="km"`, /not assignable/],
    [`${spanned} formatValue={(value) => value}`, /not assignable/],
    [`${spanned} formatValue={(value) => { return 'x' }}`, /arrow function that returns text/],
    [`${spanned} orientation="vertical"`, /orientation/],
  ])('rejects %s', async (props, message) => {
    expect(await problems({ 'Home.lite.tsx': span(props) })).toMatch(message)
  })

  it('refuses a tuple of mixed types', async () => {
    expect(
      await problems({
        'Home.lite.tsx': tsx(
          '    <MText>{state.amount}</MText>',
          "mixed: ['a', 1] as [string, number]",
        ),
      }),
    ).toMatch(/A list holds values of one type; \[string, number\] mixes them/)
  })
})

const rate = (props: string) =>
  tsx(
    `    <MRating label="Stars" value={state.amount} onChange={(value) => (state.amount = value)} ${props} />`,
  )

describe('MRating', () => {
  it('writes the stars, the halves and the text of the value', async () => {
    const { swift, vue: web, native } = await fixture('rating', 'Ratings')
    const view = swift.get('Ratings.swift')!
    expect(view).toMatch(
      /MavisRating\(\n\s+label: "Taste",\n\s+value: self\.taste,\n\s+onChange: \{ \(value: Double\) in\n\s+self\.taste = value\n\s+\},\n\s+maximum: 4\.0,\n\s+step: 0\.5,\n\s+clearLabel: "Clear taste",\n\s+formatValue: \{ \(value: Double, most: Double\) -> String in "\\\(mavisString\(value\)\) of \\\(mavisString\(most\)\)" \}\n\s+\)/,
    )
    expect(view).toMatch(/maximum: 4\.0,\n\s+clearable: false\n/)
    expect(view).toMatch(/step: 0\.5,\n\s+readonly: true\n/)
    expect(view).toMatch(/\)\n\s+\.mavisIdentifier\("stars"\)/)
    for (const output of [web, native])
      expect(output.get('Ratings.vue')).toContain(
        '<MRating label="Taste" :modelValue="state.taste" @update:modelValue="(value) => state.taste = value" :max="4" :step="0.5" clearLabel="Clear taste" :formatValue="(value, most) => `${value} of ${most}`" />',
      )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisRating: View {')
    expect(controls).toContain('MavisIcon(halved ? "star-half" : "star", size: 20)')
    expect(controls).toContain('private static let dim = try! JoltPose(scale: 0.9, rotate: -8)')
    expect(controls).toContain(
      '.accessibilityLabel(Text(verbatim: label + ": " + formatValue(Double(index), Double(count))))',
    )
  })

  it('leaves the arguments a formatter does not take unnamed in Swift', async () => {
    const { swift, vue: web } = await compile({
      'Home.lite.tsx': rate('formatValue={(value) => `${value} stars`}'),
    })
    expect(swift.get('Home.swift')).toContain(
      'formatValue: { (value: Double, _: Double) -> String in "\\(mavisString(value)) stars" }',
    )
    expect(web.get('Home.vue')).toContain(':formatValue="(value) => `${value} stars`"')
  })

  it.each([
    ['max={0}', /max is a whole number from 1 to 10/],
    ['max={2.5}', /max is a whole number from 1 to 10/],
    ['max={11}', /max is a whole number from 1 to 10/],
    ['step={0.25}', /not assignable/],
    ['step={state.amount}', /not assignable/],
    ['formatValue={(value, max) => `${Math.max(value, max)}`}', /max hides Math\.max/],
    ['formatValue={(value, most, extra) => `${value}`}', /not assignable/],
    ['formatValue={(self) => `${self}`}', /Parameter self collides/],
    ['tone="accent"', /tone/],
  ])('rejects %s', async (props, message) => {
    expect(await problems({ 'Home.lite.tsx': rate(props) })).toMatch(message)
  })

  it('reads the step a Vue file writes out', async () => {
    expect(
      await problems({
        'Home.vue': vue(
          "import { ref } from 'vue'\nconst stars = ref(3)\nconst half = ref(0.5)",
          '  <MRating v-model="stars" label="Stars" :step="half" />',
        ),
      }),
    ).toMatch(/not assignable/)
  })
})

const pin = (props: string) =>
  tsx(
    `    <MPinInput label="Code" value={state.text} onChange={(value) => (state.text = value)} ${props} />`,
  )

describe('MPinInput', () => {
  it('writes one editor with its events and its cells', async () => {
    const { swift, vue: web, native } = await fixture('pin', 'Codes')
    const view = swift.get('Codes.swift')!
    expect(view).toMatch(
      /MavisPinInput\(\n\s+label: "Code",\n\s+value: self\.code,\n\s+onChange: \{ \(value: String\) in\n\s+self\.code = value\n\s+\},\n\s+focus: \$mavisFocus,\n\s+focusKey: "pin1",\n\s+onComplete: \{ \(next: String\) in\n\s+self\.finish\(next\)\n\s+\},\n\s+length: 5\.0,\n\s+error: self\.problem,\n\s+helperText: "Five digits",\n\s+id: "code"\n\s+\)/,
    )
    expect(view).toMatch(/value: "42",[\s\S]*?length: 4\.0,\n\s+disabled: true\n/)
    for (const output of [web, native])
      expect(output.get('Codes.vue')).toContain(
        '<MPinInput id="code" label="Code" :modelValue="state.code" @update:modelValue="(value) => state.code = value" @complete="(next) => state.finish(next)" :length="5" helperText="Five digits" :error="state.problem" />',
      )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisPinInput: View {')
    // Digits only, full-width ones as ASCII, as normalizePin in the core.
    expect(controls).toContain(
      'case 0xFF10...0xFF19: kept.unicodeScalars.append(Unicode.Scalar(scalar.value - 0xFEE0)!)',
    )
    expect(controls).toContain('if next.count == count { onComplete(next) }')
    expect(controls).toContain('.frame(maxWidth: Double(count) * 56, alignment: .leading)')
  })

  it('moves focus to the editor through a reference', async () => {
    const { swift, vue: web } = await fixture('pinType', 'Entry')
    const view = swift.get('Entry.swift')!
    expect(view).toContain('focusKey: "codeRef",')
    expect(view).toContain('self.mavisFocus = "codeRef"')
    expect(web.get('Entry.vue')).toContain('<MPinInput ref="codeRef" label="Code"')
  })

  it('takes the properties of a Web form and leaves them to the Web', async () => {
    const { swift, vue: web } = await compile({
      'Home.lite.tsx': pin('name="otp" form="login" required'),
    })
    expect(swift.get('Home.swift')).not.toMatch(/otp|login|required/)
    expect(web.get('Home.vue')).toContain('name="otp" form="login" :required="true"')
  })

  it.each([
    ['length={1}', /length is a whole number from 2 to 12/],
    ['length={13}', /length is a whole number from 2 to 12/],
    ['length={4.5}', /length is a whole number from 2 to 12/],
    ['onComplete={(value) => (state.amount = value)}', /not assignable/],
    ['mask', /mask/],
  ])('rejects %s', async (props, message) => {
    expect(await problems({ 'Home.lite.tsx': pin(props) })).toMatch(message)
  })

  it('takes a code, not a number', async () => {
    expect(
      await problems({
        'Home.vue': vue(
          "import { ref } from 'vue'\nconst code = ref(0)",
          '  <MPinInput v-model="code" label="Code" />',
        ),
      }),
    ).toMatch(/not assignable/)
  })
})

describe('shared form controllers', () => {
  it('generates the public controller and focus event from both formats', async () => {
    const a = await fixture('formController', 'Profile')
    const b = await fixture('formControllerVue', 'Profile')
    expect(portableModel(a)).toEqual(portableModel(b))
    expect(swiftOf(a)).toEqual(swiftOf(b))
    expect(a.vue.get('Profile.vue')).toContain('useFormController()')
    expect(a.vue.get('Profile.vue')).toContain('useFormField(mavisForm1')
    expect(a.swift.get('Profile.swift')).toContain('MavisFormErrors(')
  })
  it('rejects registering the same field twice', async () => {
    const source = await readShared(join(portable, 'formControllerVue'))
    const text = source.get('shared/Profile.vue')!
    source.set(
      'shared/Profile.vue',
      text.replace(
        'const value =',
        "useFormField(form, { name: 'email', label: 'Another', target: () => emailField.value })\nconst value =",
      ),
    )
    await expect(compileProject(source, { root: 'Profile' })).rejects.toThrow('registered twice')
  })
})
