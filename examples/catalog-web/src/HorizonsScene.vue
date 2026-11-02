<script setup lang="ts">
import { markRaw, ref, watch } from 'vue'
import { createMotionRegion } from '@getcortexlabs/mavis-core/experimental'
import { useMavisWebMotion } from '@getcortexlabs/mavis-web/experimental'
import { MBox, MButton, MCard, MColumn, MRow, MText } from '@getcortexlabs/mavis-web'
import { createViewportEnterDirective } from '@rafaelaugusto/jolt/web/vue'

withDefaults(defineProps<{ locale?: 'en' | 'pt' }>(), { locale: 'en' })
const region = markRaw(createMotionRegion())
const rtl = ref(false)
const page = ref(0)
const clicks = ref(0)
const ready = ref(false)
// Factory belongs to this component/app, including a separate instance per SSR request.
const vEnter = createViewportEnterDirective({
  viewport: { keyframes: { y: [18, 0] }, transition: { duration: 500 }, once: true },
})
const stories = [
  ['First light', 'Primeira luz'],
  ['The quiet coast', 'A costa tranquila'],
  ['Beyond the blue', 'Além do azul'],
  ['A new latitude', 'Outra latitude'],
  ['Night in bloom', 'A noite floresce'],
  ['Homeward', 'De volta'],
]
useMavisWebMotion(region, (scope, element) => {
  const rail = element.querySelector<HTMLElement>('.horizons-rail')!
  const bar = element.querySelector<HTMLElement>('.horizons-progress')!
  const rows = () =>
    [...element.querySelectorAll<HTMLElement>('[id^="horizon-story-"]')].map((target, index) => ({
      key: page.value * 3 + index,
      target,
    }))
  const entries = scope.animateItems(
    rows(),
    { opacity: [0, 1], y: [24, 0] },
    {
      once: true,
      root: rail,
      duration: 600,
    },
  )
  for (const row of rows()) {
    scope.set(row.target, { y: 0 })
    scope.observeGeometry(row.target)
  }
  const position = scope.scrollValue(rail, { axis: 'x' })
  let geometry: ReturnType<typeof scope.scope> | undefined
  let range: number | undefined
  const refresh = () => {
    position.refresh()
    const end = Math.max(1, rail.scrollWidth - rail.clientWidth)
    if (range === end) return
    range = end
    geometry?.dispose()
    geometry = scope.scope()
    const progress = geometry.map(position, [0, end], [0.08, 1])
    geometry.bind(bar, { scaleX: progress })
    geometry.scrollLinked(
      rail,
      element.querySelector<HTMLElement>('.horizons-orbit')!,
      {
        rotate: [0, 180],
      },
      { axis: 'x', range: [0, end] },
    )
  }
  const resize = new ResizeObserver(refresh)
  resize.observe(rail)
  scope.add(() => resize.disconnect())
  refresh()
  const stop = watch(
    [page, rtl],
    () => {
      entries.update(rows())
      refresh()
    },
    { flush: 'post' },
  )
  ready.value = true
  return () => {
    stop()
    ready.value = false
  }
})
</script>
<template>
  <MBox :motionRegion="region" class="horizons-scene">
    <MColumn gap="lg">
      <header v-enter class="horizons-heading">
        <MText variant="overline" tone="accent">16 / HORIZONS</MText>
        <MText as="h1" variant="display">{{
          locale === 'pt' ? 'O próximo horizonte.' : 'The next horizon.'
        }}</MText>
        <MText tone="muted">{{
          locale === 'pt' ? 'Há sempre algo adiante.' : 'There is always more ahead.'
        }}</MText>
      </header>
      <div class="horizons-compass" aria-hidden="true"><span class="horizons-orbit">✳</span></div>
      <div
        class="horizons-rail"
        :dir="rtl ? 'rtl' : 'ltr'"
        tabindex="0"
        role="region"
        :aria-label="locale === 'pt' ? 'Histórias para explorar' : 'Stories to explore'"
      >
        <!-- Reuse the three presentation slots; the story key is its logical identity. -->
        <MCard
          v-for="slot in 3"
          :key="slot"
          :id="`horizon-story-${page * 3 + slot - 1}`"
          interactive
          :width="260"
          :shrink="0"
          @click="clicks++"
          class="horizons-story"
        >
          <MColumn gap="lg">
            <div class="horizons-art" :class="`horizons-art-${page * 3 + slot}`" aria-hidden="true">
              <i /><b />
            </div>
            <MText variant="overline" tone="accent">0{{ page * 3 + slot }}</MText>
            <MText variant="title">{{
              stories[page * 3 + slot - 1]![locale === 'pt' ? 1 : 0]
            }}</MText>
          </MColumn>
        </MCard>
      </div>
      <div class="horizons-track" aria-hidden="true"><div class="horizons-progress" /></div>
      <MRow gap="sm" wrap>
        <MButton id="horizons-next" :disabled="!ready" @click="page = 1 - page">{{
          locale === 'pt' ? 'Outras histórias' : 'Other stories'
        }}</MButton>
        <MButton
          id="horizons-direction"
          :disabled="!ready"
          variant="secondary"
          @click="rtl = !rtl"
          >{{ rtl ? 'LTR →' : '← RTL' }}</MButton
        >
        <MText id="horizons-visits" tone="muted"
          >{{ clicks }} {{ locale === 'pt' ? 'encontros' : 'encounters' }}</MText
        >
      </MRow>
    </MColumn>
  </MBox>
</template>
<style scoped>
.horizons-scene {
  width: 100%;
  max-width: 960px;
  margin-inline: auto;
}
.horizons-heading {
  display: grid;
  gap: 14px;
  max-width: 650px;
}
.horizons-compass {
  overflow: hidden;
  display: flex;
  justify-content: flex-end;
  height: 72px;
  color: var(--m-color-accent, #4262c4);
}
.horizons-orbit {
  display: block;
  font-size: 72px;
  line-height: 1;
}
.horizons-rail {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 16px 8px 24px;
  scroll-snap-type: x proximity;
}
.horizons-story {
  scroll-snap-align: start;
}
.horizons-art {
  height: 150px;
  overflow: hidden;
  border-radius: 12px;
  position: relative;
  background: linear-gradient(145deg, #ead5e7, #afbce6);
}
.horizons-art i {
  position: absolute;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: #faf7fa;
  inset: 34px 15px auto auto;
}
.horizons-art b {
  position: absolute;
  width: 360px;
  height: 130px;
  border-radius: 50%;
  background: #4262c4;
  left: -30px;
  top: 105px;
  transform: rotate(-15deg);
}
.horizons-art-2,
.horizons-art-5 {
  background: linear-gradient(145deg, #39315d, #bd79a6);
}
.horizons-art-3,
.horizons-art-6 {
  background: linear-gradient(145deg, #c5d7f5, #f4c9dc);
}
.horizons-art-2 b,
.horizons-art-4 b {
  background: #b83670;
  transform: rotate(15deg);
}
.horizons-track {
  height: 4px;
  border-radius: 4px;
  background: #adb9de44;
  overflow: hidden;
}
.horizons-progress {
  height: 100%;
  background: #b83670;
  transform-origin: left;
}
</style>
