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

describe('owned motion surfaces', () => {
  it('retires queued attachment work before SwiftUI replaces a presentation', async () => {
    const tsx = await fixture('motionAnchorLife', 'Home')
    const vue = await fixture('motionAnchorLifeVue', 'Home')
    expect(vue.swift.get('Home.swift').split('\n').slice(1)).toEqual(
      tsx.swift.get('Home.swift').split('\n').slice(1),
    )
    const runtime = tsx.swift.get('MavisControls.swift')
    expect(runtime).toContain(
      'dismantleNSView(_ view: Anchor, coordinator: ()) { view.invalidate() }',
    )
    expect(runtime).toContain('let previous = surface; surface = nil')
    expect(runtime).toContain('!self.invalidated, self.revision == token')
    expect(runtime).toContain('guard window != nil else { surface.detach(self); return }')
    expect(runtime).toContain('precondition(attachment == nil || attachment === view')
  })
  it('binds image motion to loaded artwork and gives replaced sources separate presentations', async () => {
    const tsx = await fixture('motionImage', 'Home')
    const vue = await fixture('motionImageVue', 'Home')
    expect(vue.swift.get('Home.swift').split('\n').slice(1)).toEqual(
      tsx.swift.get('Home.swift').split('\n').slice(1),
    )
    expect(tsx.swift.get('Home.swift')).toContain('motionSurface: self.motion')
    expect(tsx.vue.get('Home.vue')).toContain(':motionSurface="motion"')
    const runtime = tsx.swift.get('MavisControls.swift')
    expect(runtime).toContain('var motionSurface: MavisMotionSurface? = nil')
    expect(runtime).toContain('let picture = completedSource == src ? self.picture : nil')
    expect(runtime).toMatch(/if let motionSurface \{\s+if let picture \{/)
    expect(runtime).toMatch(/\.mavisMotionSurface\(motionSurface\)\s+\.id\(src\)/)
  })
  it('binds the same owned surface to an icon without needing a box target', async () => {
    const tsx = await fixture('motionIcon', 'Home')
    const vue = await fixture('motionIconVue', 'Home')
    expect(vue.swift.get('Home.swift').split('\n').slice(1)).toEqual(
      tsx.swift.get('Home.swift').split('\n').slice(1),
    )
    expect(tsx.swift.get('Home.swift')).toContain('.mavisMotionSurface(self.motion)')
    expect(tsx.swift.get('Home.swift')).not.toContain('MavisLayers {')
    expect(tsx.vue.get('Home.vue')).toContain(':motionSurface="motion"')
    expect(tsx.swift.get('MavisControls.swift')).toContain('struct MavisMotionSurfaceBinding')
  })
  it('keeps source parity, null starting frames and async playback completion', async () => {
    const tsx = await fixture('motionSurface', 'Home')
    const vue = await fixture('motionSurfaceVue', 'Home')
    expect(vue.swift.get('Home.swift').split('\n').slice(1)).toEqual(
      tsx.swift.get('Home.swift').split('\n').slice(1),
    )
    const source = tsx.swift.get('Home.swift')
    expect(source).toContain('@StateObject private var motion: MavisMotionSurface')
    expect(source).toContain('"x": [nil, 24.0]')
    expect(source).toContain('let finished: Bool = await playback.finished')
    expect(source).toContain('context.motion.dispose()')
    expect(source).toContain('context.move()')
    const web = tsx.vue.get('Home.vue')
    expect(web).toContain(
      "import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'",
    )
    expect(web).toContain('x: [null, 24]')
    expect(web).toContain('const finished = await playback.finished')
    expect(web).toContain(':motionSurface="motion"')
  })
  it('owns an availability callback without retaining a SwiftUI view', async () => {
    const out = await compile({
      'Home.vue': `<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { createMotionSurface, type MotionPlayback } from '@getcortexlabs/mavis-core/experimental'
const surface = createMotionSurface()
const ready = ref(false)
onMounted(() => { surface.onAvailable(() => { ready.value = surface.available }) })
</script><template><MBox :motionSurface="surface"><MText>{{ready}}</MText></MBox></template>`,
    })
    const source = out.swift.get('Home.swift')
    expect(source).toContain('self.surface.onAvailable({ [mavisOwner = self]')
    expect(source).toContain('self.ready = self.surface.available')
    expect(source).toContain('context.surface.dispose()')
    expect(source).not.toContain('mavisOwner = self.mavisLifetime')
  })
  it('awaits discarded completion and canonicalizes options independent of authored order', async () => {
    const out = await compile({
      'Home.vue': `<script setup lang="ts">
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
const surface = createMotionSurface()
async function run() { try {
  const playback = surface.animate({y:24}, {delay:0, ease:'linear', duration:100, type:'tween'})
  playback.stop()
  await playback.finished
} catch {} }
</script><template><MColumn><MBox :motionSurface="surface"><MText>Target</MText></MBox><MButton @click="run">Run</MButton></MColumn></template>`,
    })
    expect(out.swift.get('Home.swift')).toContain(
      'MavisMotionOptions(type: "tween", duration: 100.0, ease: "linear", delay: 0.0)',
    )
    expect(out.swift.get('Home.swift')).toContain('_ = await playback.finished')
  })
  it.each([
    ['surface.animate({x:[0,10,20]})', 'from/to pair'],
    ['surface.animate({shadowBlur:10})', 'not a supported motion channel'],
    ['surface.animate({x:10},{type:"gravity"})', 'supports spring and tween'],
    ['surface.animate({x:10},{duration:61000})', 'between 0 and 60000'],
    ['surface.onAvailable(() => { throw new Error("Setup failed") })', 'Handle errors inside'],
  ])('diagnoses unsupported authored motion: %s', async (body, message) => {
    await expect(
      compile({
        'Home.vue': `<script setup lang="ts">
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
const surface = createMotionSurface()
function run(){try { ${body} }catch{}}
</script><template><MColumn><MBox :motionSurface="surface"/><MButton @click="run">Run</MButton></MColumn></template>`,
      }),
    ).rejects.toThrow(message)
  })
  it('rejects binding one owner to two views', async () => {
    await expect(
      compile({
        'Home.vue': `<script setup lang="ts">
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
const surface = createMotionSurface()
</script><template><MColumn><MBox :motionSurface="surface"/><MBox :motionSurface="surface"/></MColumn></template>`,
      }),
    ).rejects.toThrow('one view at a time')
  })
})

describe('owned motion regions', () => {
  it('resolves multiple public factories on MBox and preserves a coordinated timeline in both formats', async () => {
    const tsx = await fixture('motionTimeline', 'Home')
    const vue = await fixture('motionTimelineVue', 'Home')
    expect(vue.swift.get('Home.swift').split('\n').slice(1)).toEqual(
      tsx.swift.get('Home.swift').split('\n').slice(1),
    )
    expect(tsx.model.components[0].refs.map((ref: { factory: string }) => ref.factory)).toEqual([
      'createMotionSurface',
      'createMotionSurface',
      'createMotionRegion',
    ])
    const source = tsx.swift.get('Home.swift')
    expect(source).toContain('@StateObject private var region: MavisMotionRegion')
    expect(source).toContain('@StateObject private var first: MavisMotionSurface')
    expect(source).toContain('at: .previous')
    expect(source).toContain('at: .relative("+20")')
    expect(source).toContain('await timeline.finished')
    expect(source).toContain('context.region.dispose()')
    expect(source).toContain('context.first.dispose()')
    expect(tsx.vue.get('Home.vue')).toContain('const region = createMotionRegion()')
    expect(tsx.vue.get('Home.vue')).toContain(':motionRegion="region"')
    expect(tsx.vue.get('Home.vue')).toContain("at: '<'")
    const runtime = tsx.swift.get('MavisControls.swift')
    expect(runtime).toContain('try play(tracks, targets: steps.map(\\.surface))')
    expect(runtime).toContain('let probe = try JoltTimeline(tracks: stage, autoplay: false)')
    expect(runtime).toContain('owners.contains(where: { $0.suspended })')
    expect(runtime).not.toContain('Timer.scheduledTimer')
  })
  it('shares sequence statements without misrouting them to the surface emitter', async () => {
    const output = await compile({
      'Home.vue': `<script setup lang="ts">
import { createMotionSurface, createMotionRegion, type MotionRegion } from '@getcortexlabs/mavis-core/experimental'
const surface=createMotionSurface()
const region=createMotionRegion()
function play(){try{region.sequence([[surface,{opacity:1},{duration:100}]])}catch{}}
</script><template><MColumn><MBox :motionSurface="surface" :motionRegion="region"><MText>Target</MText></MBox><MButton @click="play">Play</MButton></MColumn></template>`,
    })
    expect(output.swift.get('Home.swift')).toContain(
      'try self.region.sequence([MavisMotionStep(surface: self.surface',
    )
    expect(output.swift.get('Home.swift')).toContain('.mavisMotionRegion(self.region)')
  })
  it.each([
    ['[[surface,{x:1},{at:"-20"}]]', 'backward scheduling'],
    ['[() => surface.animate({x:1})]', 'callback timeline steps'],
    ['[]', '1–256 steps'],
  ])('keeps an explicit diagnostic for unsupported timelines %s', async (steps, message) => {
    await expect(
      compile({
        'Home.vue': `<script setup lang="ts">
import { createMotionSurface, createMotionRegion } from '@getcortexlabs/mavis-core/experimental'
const surface=createMotionSurface()
const region=createMotionRegion()
function play(){try{region.timeline(${steps})}catch{}}
</script><template><MColumn><MBox :motionSurface="surface" :motionRegion="region"/><MButton @click="play">Play</MButton></MColumn></template>`,
      }),
    ).rejects.toThrow(message)
  })
})

describe('motion presentation cleanup', () => {
  it.each([
    ['surface.onAvailable', 'surface.onAvailable', '()'],
    ['surface.use', 'surface.use', '(child)'],
    ['region.onAvailable', 'region.onAvailable', '()'],
    ['whenMotionAvailable([surface, region],', 'mavisWhenMotionAvailable', '()'],
  ])(
    'discards an ignored %s unsubscribe but preserves an explicitly retained one',
    async (call, swiftCall, parameters) => {
      const subscribe = `${call}${call.endsWith(',') ? '' : '('}${parameters} => {
      count.value += 1
      return () => { count.value -= 1 }
    })`
      const out = await compile({
        'Home.vue': `<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { createMotionSurface, createMotionRegion, whenMotionAvailable } from '@getcortexlabs/mavis-core/experimental'
const surface = createMotionSurface()
const region = createMotionRegion()
const count = ref(0)
onMounted(() => { ${subscribe} })
function cancel() {
  const stop = ${subscribe}
  stop()
}
</script><template><MColumn><MBox :motionSurface="surface" :motionRegion="region"><MText>{{count}}</MText></MBox><MButton @click="cancel">Cancel</MButton></MColumn></template>`,
      })
      const target = swiftCall.startsWith('mavis') ? swiftCall : `self.${swiftCall}`
      const source = out.swift.get('Home.swift')
      expect(source).toContain(`_ = ${target}(`)
      expect(source).toContain(`let stop: () -> Void = ${target}(`)
      expect(source).toContain('stop()')
      expect(source).toContain('self.count -= 1.0')
    },
  )

  it('preserves presentation child ownership in equivalent TSX and Vue fixtures', async () => {
    const tsx = await fixture('motionUse', 'Home')
    const vue = await fixture('motionUseVue', 'Home')
    expect(vue.swift.get('Home.swift').split('\n').slice(1)).toEqual(
      tsx.swift.get('Home.swift').split('\n').slice(1),
    )
    expect(tsx.vue.get('Home.vue')).toContain('surface.use((child) =>')
    expect(tsx.vue.get('Home.vue')).toContain('child.set({ x: 12 })')
  })
  it('passes a presentation-owned child surface to use and retains that child in cleanup', async () => {
    const out = await compile({
      'Home.vue': `<script setup lang="ts">
import {ref,onMounted} from 'vue'
import {createMotionSurface} from '@getcortexlabs/mavis-core/experimental'
const surface=createMotionSurface()
const ready=ref(false)
onMounted(()=>{
  surface.use(child=>{
    ready.value=child.available
    try {child.set({x:12})} catch {ready.value=false}
    return ()=>{ready.value=child.available}
  })
})
</script><template><MColumn><MBox :motionSurface="surface"/><MText>{{ready}}</MText></MColumn></template>`,
    })
    const source = out.swift.get('Home.swift')
    expect(source).toContain('self.surface.use(')
    expect(source).toContain('child: MavisMotionSurface')
    expect(source).toContain('try child.set(["x": 12.0])')
    expect(source).toContain('mavisCapture0 = child')
    expect(source).toContain('self.ready = child.available')
  })
  it('keeps unsubscribe captures escaping when a retained setup returns another cleanup', async () => {
    const out = await compile({
      'Home.vue': `<script setup lang="ts">
import {ref} from 'vue'
import {createMotionSurface, createMotionRegion} from '@getcortexlabs/mavis-core/experimental'
const surface=createMotionSurface()
const region=createMotionRegion()
const count=ref(0)
function subscribe(){
  const stop=surface.onAvailable(()=>{count.value+=1})
  region.onAvailable(()=>{return ()=>{stop()}})
}
</script><template><MColumn><MBox :motionSurface="surface" :motionRegion="region"><MText>{{count}}</MText></MBox><MButton @click="subscribe">Subscribe</MButton></MColumn></template>`,
    })
    const source = out.swift.get('Home.swift')
    expect(source).toContain('_ stop: @escaping () -> Void')
    expect(source).toContain('mavisCapture0 = stop')
    expect(source).toContain('stop()')
  })
  it('returns and calls setup cleanup while retaining local playback values safely', async () => {
    const out = await compile({
      'Home.vue': `<script setup lang="ts">
import {ref} from 'vue'
import {createMotionSurface} from '@getcortexlabs/mavis-core/experimental'
const surface=createMotionSurface()
const count=ref(0)
function subscribe(){
  const stop=surface.onAvailable(()=>{
    count.value+=1
    return ()=>{count.value-=1}
  })
  stop()
}
</script><template><MColumn><MBox :motionSurface="surface"><MText>{{count}}</MText></MBox><MButton @click="subscribe">Subscribe</MButton></MColumn></template>`,
    })
    const source = out.swift.get('Home.swift')
    expect(source).toContain('let stop: () -> Void = self.surface.onAvailable(')
    expect(source).toContain('stop()')
    expect(source).toContain('-> () -> Void in')
    expect(source).toContain('self.count -= 1.0')
    const runtime = out.swift.get('MavisControls.swift')
    expect(runtime).toContain('self.cleanups.removeValue(forKey: id)?()')
    expect(runtime).toContain('for id in created { self.playbacks[id]?.stop() }')
    expect(runtime).toContain('clearSetups()')
  })
})

it('shares whenMotionAvailable and cleanup through lifecycle and both source formats', async () => {
  const tsx = await fixture('motionAvailability', 'Home')
  const vue = await fixture('motionAvailabilityVue', 'Home')
  expect(vue.swift.get('Home.swift').split('\n').slice(1)).toEqual(
    tsx.swift.get('Home.swift').split('\n').slice(1),
  )
  expect(tsx.swift.get('Home.swift')).toContain(
    'mavisWhenMotionAvailable([self.surface, self.region]',
  )
  expect(tsx.swift.get('Home.swift')).toContain('self.cleanups += 1.0')
  expect(tsx.vue.get('Home.vue')).toContain('whenMotionAvailable([surface, region], () => {')
  expect(tsx.vue.get('Home.vue')).toContain('whenMotionAvailable } from')
  expect(tsx.vue.get('Home.vue')).toContain('stop()')
  expect(tsx.vue.get('Home.vue')).toContain('state.cleanups += 1')
  expect(tsx.swift.get('Home.swift')).toContain('_ stop: @escaping () -> Void')
})
