<script setup lang="ts">
import { markRaw, ref } from 'vue'
import { createMotionRegion, createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { useMavisWebMotion } from '@getcortexlabs/mavis-web/experimental'
import type { WebAnimation, WebPathDrawing, WebMotionScope } from '@rafaelaugusto/jolt/web'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useCatalogLocale } from '../../catalog/shared/locale'
import ThemeSwitch from '../../catalog/shared/ThemeSwitch.vue'

const { locale } = useCatalogLocale()
const { theme } = useMavisTheme()
const region = markRaw(createMotionRegion())
const surface = markRaw(createMotionSurface())
const curved = ref(false)
const clicks = ref(0)
const ready = ref(false)
let drawing: WebPathDrawing | undefined
let animation: WebAnimation | undefined
let scope: WebMotionScope | undefined
let card: HTMLElement | undefined
useMavisWebMotion(region, (owner, element) => {
  scope = owner
  card = element.querySelector<HTMLElement>('#web-motion-card')!
  drawing = owner.drawPath(element.querySelector<SVGPathElement>('#motion-path')!, { progress: 1 })
  ready.value = true
  return () => {
    ready.value = false
    drawing = animation = scope = card = undefined
  }
})
function draw(to: number) {
  animation = drawing?.animate(to, { duration: 1800, ease: 'easeInOut' })
  drawing?.play()
}
function paint() {
  if (scope && card)
    scope.animate(
      card,
      {
        scale: [1, 1.06, 1],
        backgroundColor: [
          theme.value.colors.surface,
          theme.value.colors.accentSoft,
          theme.value.colors.surface,
        ],
      },
      { duration: 1600 },
    )
}
</script>
<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg">
      <m-row justify="between"><m-link href="#/showcase">← Showcase</m-link><ThemeSwitch /></m-row>
      <m-link href="#/showcase/horizons">Horizons →</m-link>
      <m-text variant="overline" tone="accent">15 / CONNECTIONS</m-text>
      <m-text as="h1" variant="display">{{
        locale === 'pt' ? 'Ideias que se encontram.' : 'Ideas find each other.'
      }}</m-text>
      <m-text tone="muted">{{
        locale === 'pt' ? 'Um caminho. Infinitas conversas.' : 'One path. Endless conversations.'
      }}</m-text>
      <m-box
        :motionRegion="region"
        padding="lg"
        radius="lg"
        :backgroundColor="theme.colors.accentSoft"
      >
        <m-column align="center" gap="lg">
          <svg
            viewBox="0 0 320 180"
            role="img"
            :aria-label="
              locale === 'pt' ? 'Conexão entre duas ideias' : 'A connection between two ideas'
            "
            style="width: 100%; max-width: 520px; height: auto; overflow: visible"
          >
            <path
              :d="
                curved
                  ? 'M30 90 C80 0 240 180 290 90'
                  : 'M30 90 C90 90 100 30 160 90 S230 90 290 90'
              "
              fill="none"
              :stroke="theme.colors.border"
              stroke-width="2"
            />
            <path
              id="motion-path"
              :d="
                curved
                  ? 'M30 90 C80 0 240 180 290 90'
                  : 'M30 90 C90 90 100 30 160 90 S230 90 290 90'
              "
              pathLength="100"
              fill="none"
              :stroke="theme.colors.accent"
              stroke-width="4"
              stroke-linecap="round"
            />
            <circle cx="30" cy="90" r="13" :fill="theme.colors.primary" />
            <circle cx="290" cy="90" r="13" :fill="theme.colors.accent" />
          </svg>
          <m-card
            id="web-motion-card"
            :motionSurface="surface"
            interactive
            :width="240"
            padding="lg"
            gap="sm"
            @click="clicks++"
          >
            <m-icon name="sparkles" tone="accent" />
            <m-text variant="heading">{{
              locale === 'pt' ? 'Uma nova conexão.' : 'A new connection.'
            }}</m-text>
            <m-text id="web-motion-clicks" variant="caption" tone="muted"
              >{{ clicks }} {{ locale === 'pt' ? 'encontros' : 'connections' }}</m-text
            >
          </m-card>
        </m-column>
      </m-box>
      <m-row wrap gap="sm">
        <m-button id="path-draw" :disabled="!ready" @click="draw(1)">{{
          locale === 'pt' ? 'Conectar' : 'Connect'
        }}</m-button>
        <m-button id="path-reverse" :disabled="!ready" variant="secondary" @click="draw(0)">{{
          locale === 'pt' ? 'Voltar' : 'Return'
        }}</m-button>
        <m-button id="path-pause" :disabled="!ready" variant="ghost" @click="drawing?.pause()">{{
          locale === 'pt' ? 'Pausar' : 'Pause'
        }}</m-button>
        <m-button id="path-resume" :disabled="!ready" variant="ghost" @click="drawing?.play()">{{
          locale === 'pt' ? 'Continuar' : 'Resume'
        }}</m-button>
        <m-button
          id="path-seek"
          :disabled="!ready"
          variant="ghost"
          @click="animation && (animation.progress = 0.5)"
          >50%</m-button
        >
        <m-button id="path-geometry" variant="ghost" @click="curved = !curved">{{
          locale === 'pt' ? 'Outro caminho' : 'Another path'
        }}</m-button>
        <m-button id="path-paint" :disabled="!ready" variant="secondary" @click="paint">{{
          locale === 'pt' ? 'Dar cor' : 'Bring color'
        }}</m-button>
      </m-row>
    </m-column>
  </m-screen>
</template>
