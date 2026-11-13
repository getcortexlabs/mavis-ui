import { describe, expect, it } from 'vitest'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships its sources with the creator.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

const fixture = async (name: string) =>
  compileProject(await readShared(new URL(`./portable/${name}`, import.meta.url).pathname), {
    root: 'Home',
  })
const compile = (source: string) =>
  compileProject(new Map([['shared/Home.vue', source]]), { root: 'Home' })

describe('primitive surfaces and independent card controls', () => {
  it.each(['primitiveSurfaces', 'cardControls', 'cardControlsEditing'])(
    'keeps %s identical between TSX and Vue',
    async (name) => {
      const tsx = await fixture(name),
        vue = await fixture(`${name}Vue`)
      expect(vue.swift.get('Home.swift').split('\n').slice(1)).toEqual(
        tsx.swift.get('Home.swift').split('\n').slice(1),
      )
    },
  )
  it('binds all three primitives to their existing surface owners, outside press feedback', async () => {
    const output = await fixture('primitiveSurfaces')
    const view = output.swift.get('Home.swift')
    for (const name of ['button', 'card', 'text']) {
      expect(view).toContain(`.mavisMotionSurface(self.${name})`)
      expect(view).toContain(`private var ${name}: MavisMotionSurface`)
      expect(output.vue.get('Home.vue')).toContain(`:motionSurface="${name}"`)
      expect(output.native.get('Home.vue')).toContain(`:motionSurface="${name}"`)
    }
    expect(view).toMatch(
      /\.buttonStyle\(MavisButtonStyle\(\)\)[\s\S]*\.mavisMotionSurface\(self.button\)/,
    )
    const runtime = output.swift.get('MavisControls.swift')
    expect(runtime.match(/final class MavisMotionSurface:/g)).toHaveLength(1)
    expect(runtime).toContain('content.joltBind(surface.values)')
    expect(runtime).toContain('static func dismantleNSView')
  })
  it('emits the card action as a sibling surface and keeps its disabled state off child controls', async () => {
    const output = await fixture('cardControls'),
      view = output.swift.get('Home.swift')
    expect(view).toContain(
      'MavisCardActions(name: "Open collection", disabled: self.disabled, action:',
    )
    expect(view).not.toContain('.disabled(self.disabled)')
    expect(view).toContain('Text(verbatim: "Nested action")')
    const runtime = output.swift.get('MavisControls.swift')
    const actions = runtime.slice(
      runtime.indexOf('struct MavisCardActions<'),
      runtime.indexOf('private struct MavisCardActionStyle'),
    )
    expect(actions).toContain(
      'content()\n            .background {\n                Button(action: action)',
    )
    expect(actions).toContain('.disabled(disabled)')
    expect(actions).toContain('.joltMotion(to: pressed && !disabled')
    expect(actions).not.toContain('Button(action: action) { content()')
  })
  it.each([
    '<MAlert title="Saved"/>',
    '<MChip label="Tag" selectable :modelValue="false" @update:modelValue="noop"/>',
    '<MCheckbox label="Keep" :modelValue="false" @update:modelValue="noop"/>',
    '<slot/>',
  ])('accepts interactive content %s without a nested action wrapper', async (content) => {
    const output = await compile(
      `<script setup lang="ts">function noop() {}</script><template><MCard interactive accessibilityLabel="Open" @click="noop">${content}</MCard></template>`,
    )
    expect(output.swift.get('Home.swift')).toContain('MavisCardActions(name: "Open"')
  })
  it('continues rejecting controls inside an href card rather than emitting nested interactive anchors', async () => {
    await expect(
      compile(
        '<script setup lang="ts">function noop() {}</script><template><MCard href="/details" accessibilityLabel="Open"><MButton text="Child" @click="noop"/></MCard></template>',
      ),
    ).rejects.toThrow('A card with an href is one link')
  })
  it('continues enforcing one owner per surface across the newly supported primitives', async () => {
    await expect(
      compile(
        `<script setup lang="ts">import { markRaw } from 'vue'; import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'; const motion = markRaw(createMotionSurface()); function noop() {}</script><template><MColumn><MText :motionSurface="motion">Text</MText><MButton text="Button" :motionSurface="motion" @click="noop"/></MColumn></template>`,
      ),
    ).rejects.toThrow(/already|one|same/)
  })
})
