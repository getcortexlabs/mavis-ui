import { describe, expect, it } from 'vitest'
import { revealProps } from '../packages/core/src/vue/props'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { components } from '../packages/create-mavis/templates/macos/scripts/portable/components/index.mjs'
const fixture = async (name: string, root: string) =>
  compileProject(await readShared(new URL(`./portable/${name}`, import.meta.url).pathname), {
    root,
  })
const compile = (files: Record<string, string>) =>
  compileProject(new Map(Object.entries(files).map(([name, text]) => [`shared/${name}`, text])), {
    root: 'Home',
  })
describe('shared explicit reveal', () => {
  it('reads the same real component and independent column props in TSX and Vue', async () => {
    const tsx = await fixture('reveal', 'Details')
    const vue = await fixture('revealVue', 'Details')
    expect(vue.swift.get('Details.swift').split('\n').slice(1)).toEqual(
      tsx.swift.get('Details.swift').split('\n').slice(1),
    )
    const view = tsx.swift.get('Details.swift')
    expect(view).toContain('MavisReveal(show: self.show)')
    expect(view).toContain('MavisColumn(spacing: 8)')
    expect(view).toContain('.padding(16)')
    expect(tsx.vue.get('Details.vue')).toContain('<MReveal :show="state.show" gap="sm"')
    for (const name of Object.keys(revealProps))
      expect(components.MReveal.props).toHaveProperty(name)
  })
  it('accepts reveal outside a column, with false as the default show value', async () => {
    const out = await compile({
      'Home.vue': '<template><MRow><MReveal><MText>Hidden</MText></MReveal></MRow></template>',
    })
    expect(out.swift.get('Home.swift')).toContain('MavisReveal(show: false)')
  })
  it('uses Jolt for height and opacity, excludes absent space and guards interrupted completions', async () => {
    const out = await fixture('reveal', 'Details')
    const runtime = out.swift.get('MavisControls.swift')
    expect(runtime).toContain('let progress: JoltMotionValue')
    expect(runtime).toContain('self.revision == token')
    expect(runtime).toContain('.layoutValue(key: MavisAbsentKey.self, value: !model.present)')
    expect(runtime).toContain('.allowsHitTesting(show)')
    expect(runtime).toContain('if !moving {')
    expect(runtime).not.toContain('Timer.scheduledTimer')
  })
})

describe('Jolt text effects', () => {
  it('keeps formatted numbers, custom formatters and replay keys equivalent in both formats', async () => {
    const tsx = await fixture('textMotion', 'Metrics')
    const vue = await fixture('textMotionVue', 'Metrics')
    expect(vue.swift.get('Metrics.swift').split('\n').slice(1)).toEqual(
      tsx.swift.get('Metrics.swift').split('\n').slice(1),
    )
    const view = tsx.swift.get('Metrics.swift')
    expect(view).toContain('MavisAnimatedText(')
    expect(view).toContain('MavisNumberFlow(')
    expect(view).toContain('replayKey: "number:" + mavisString(self.replay)')
    const runtime = tsx.swift.get('MavisControls.swift')
    expect(runtime).toContain('JoltAnimatedText(entrance)')
    expect(runtime).toContain('JoltRollingText(number, alignment: .leading)')
    expect(runtime).toContain('formatter.roundingMode = .halfUp')
    expect(runtime).toContain('number?.dispose()')
  })
  it.each([
    '<MAnimatedText text="Oops" :duration="0" />',
    '<MNumberFlow :value="3" :duration="0" />',
    '<MAnimatedText text="Oops" :stagger="-1" />',
  ])('rejects invalid timing %s', async (template) => {
    await expect(compile({ 'Home.vue': `<template>${template}</template>` })).rejects.toThrow(
      /must be finite and/,
    )
  })
})

describe('scoped particle effects', () => {
  it('keeps content and burst/skipped events equivalent in both source formats', async () => {
    const tsx = await fixture('particles', 'Celebration')
    const vue = await fixture('particlesVue', 'Celebration')
    expect(vue.swift.get('Celebration.swift').split('\n').slice(1)).toEqual(
      tsx.swift.get('Celebration.swift').split('\n').slice(1),
    )
    const runtime = tsx.swift.get('MavisControls.swift')
    expect(runtime).toContain('JoltParticlesView(particles)')
    expect(runtime).toContain('model.start(options, rate: count * 5, duration: 200)')
    expect(runtime).toContain('.onChange(of: trigger)')
    expect(runtime).not.toContain('Timer.scheduledTimer')
  })
  it('diagnoses the missing continuous Jolt emitter instead of silently stopping after a minute', async () => {
    await expect(
      compile({
        'Home.vue':
          '<template><MParticleField active><MText>Content</MText></MParticleField></template>',
      }),
    ).rejects.toThrow(/continuous JoltSwiftUI emitter/)
    await expect(
      compile({ 'Home.vue': '<template><MParticleField active :duration="60000" /></template>' }),
    ).rejects.toThrow(/duration plus lifetime/)
  })
  it('accepts a still particle field without inventing a duration or starting a clock', async () => {
    const out = await compile({
      'Home.vue': '<template><MParticleField><MText>Content</MText></MParticleField></template>',
    })
    expect(out.swift.get('Home.swift')).toContain('MavisParticleField()')
  })
})

describe('Jolt marquee', () => {
  it.each(['marquee', 'marqueeReduced'])(
    'keeps %s authored state and record identities in both source formats',
    async (name) => {
      const tsx = await fixture(name, 'Partners'),
        vue = await fixture(`${name}Vue`, 'Partners')
      expect(vue.swift.get('Partners.swift').split('\n').slice(1)).toEqual(
        tsx.swift.get('Partners.swift').split('\n').slice(1),
      )
      const runtime = tsx.swift.get('MavisControls.swift')
      expect(runtime).toContain('JoltViewportEntry(threshold: 0, once: false)')
      expect(runtime).toContain('JoltMotionValue(0)')
      expect(runtime).toContain('progress.pause()')
      expect(runtime).toContain('60000 / duration')
      expect(runtime).toContain('viewport.visible')
      expect(runtime).not.toContain('Timer.scheduledTimer')
    },
  )
  it('supports the existing named paused model', async () => {
    const out = await compile({
      'Home.vue': `<script setup lang="ts">
import { ref } from 'vue'
type Partner = { id: string; label: string }
const items = ref<Partner[]>([{id:'a',label:'A'}])
const paused = ref(false)
</script><template><MMarquee label="Partners" :items="items" v-model:paused="paused" /></template>`,
    })
    expect(out.swift.get('Home.swift')).toMatch(
      /onUpdatePaused: \{ \(value: Bool\) in\n +self.paused = value/,
    )
  })
  it.each(['speed="fast"', ':speed="0"', ':itemWidth="20"', ':gap="-1"'])(
    'rejects invalid %s',
    async (attrs) => {
      await expect(
        compile({
          'Home.vue': `<script setup lang="ts">
import { ref } from 'vue'
type Partner = { id: string; label: string }
const items = ref<Partner[]>([{id:'a',label:'A'}])
</script><template><MMarquee label="Partners" :items="items" ${attrs}/></template>`,
        }),
      ).rejects.toThrow()
    },
  )
})
