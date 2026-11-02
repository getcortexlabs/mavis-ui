<script setup lang="ts">
import { markRaw, onBeforeUnmount, ref } from 'vue'
import { createMotionRegion, createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useCatalog } from '../context'
import { useCatalogLocale } from '../locale'
import { createTempoMotion } from '../tempo-motion'
import ThemeSwitch from '../ThemeSwitch.vue'

const { t, locale } = useCatalogLocale()
const { theme } = useMavisTheme()
const { navigation } = useCatalog()
const region = markRaw(createMotionRegion())
const surface = markRaw(createMotionSurface())
const edition = ref(1)
const mounted = ref(true)
const checkpoints = ref(0)
const presses = ref(0)
const message = ref('A little room to move.')
let motion: ReturnType<typeof createTempoMotion> | undefined
let values: ReturnType<NonNullable<typeof motion>['values']> | undefined
const off = region.onAvailable(() => {
  motion = createTempoMotion(surface, region, () => {
    checkpoints.value++
  })
  return () => {
    motion?.dispose()
    motion = undefined
    values = undefined
  }
})
function play() {
  values = motion?.values()
  message.value = 'Find your rhythm.'
}
function state(name: string) {
  motion?.state(name)
  message.value =
    name === 'success'
      ? 'Everything in its place.'
      : name === 'error'
        ? 'A chance to try again.'
        : 'Something is taking shape.'
}
onBeforeUnmount(off)
</script>
<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg">
      <m-row justify="between" gap="sm">
        <m-button variant="ghost" size="sm" @click="navigation.back('/showcase')">{{
          t('← Showcase')
        }}</m-button>
        <ThemeSwitch />
      </m-row>
      <m-column gap="xs">
        <m-text variant="overline" tone="primary">14 / TEMPO</m-text>
        <m-text as="h1" variant="display">{{
          locale === 'pt' ? 'Cada detalhe. No seu tempo.' : 'Every detail. In time.'
        }}</m-text>
        <m-text tone="muted">{{
          locale === 'pt'
            ? 'Uma pequena edição de ideias em movimento.'
            : 'A small edition of ideas in motion.'
        }}</m-text>
      </m-column>
      <m-box :motionRegion="region" radius="lg" :backgroundColor="theme.colors.primarySoft">
        <m-column paddingY="xl" align="center" justify="center">
          <m-card
            v-if="mounted"
            :key="edition"
            id="tempo-card"
            :motionSurface="surface"
            interactive
            :width="230"
            padding="lg"
            gap="lg"
            @click="presses++"
          >
            <m-row justify="between">
              <m-text variant="overline" tone="primary">TEMPO / 0{{ edition }}</m-text>
              <m-icon name="sparkles" tone="primary" />
            </m-row>
            <m-text variant="title">{{
              locale === 'pt' ? 'Faça\numa pausa.' : 'Take\na moment.'
            }}</m-text>
            <m-separator />
            <m-text variant="caption" tone="muted">{{ t(message) }}</m-text>
          </m-card>
        </m-column>
      </m-box>
      <m-row wrap gap="sm">
        <m-button id="tempo-values" size="sm" @click="play">{{
          locale === 'pt' ? 'Encontrar o ritmo' : 'Find the rhythm'
        }}</m-button>
        <m-button id="tempo-sequence" size="sm" variant="secondary" @click="motion?.sequence()">{{
          locale === 'pt' ? 'Em sequência' : 'In sequence'
        }}</m-button>
        <m-button id="tempo-timeline" size="sm" variant="secondary" @click="motion?.timeline()">{{
          locale === 'pt' ? 'Em conjunto' : 'Together'
        }}</m-button>
      </m-row>
      <m-row wrap gap="sm">
        <m-button id="tempo-pause" size="sm" variant="ghost" @click="motion?.pause()">{{
          t('Pause')
        }}</m-button>
        <m-button id="tempo-resume" size="sm" variant="ghost" @click="motion?.resume()">{{
          t('Resume')
        }}</m-button>
        <m-button id="tempo-seek" size="sm" variant="ghost" @click="motion?.seek(0.5)"
          >50%</m-button
        >
        <m-button id="tempo-stop" size="sm" variant="ghost" @click="motion?.stop()">{{
          t('Stop')
        }}</m-button>
        <m-button id="tempo-accent" size="sm" variant="ghost" @click="values?.accent()">{{
          locale === 'pt' ? 'Dar um acento' : 'Add an accent'
        }}</m-button>
        <m-button
          id="tempo-remove-accent"
          size="sm"
          variant="ghost"
          @click="values?.removeAccent()"
          >{{ locale === 'pt' ? 'Retirar o acento' : 'Remove accent' }}</m-button
        >
      </m-row>
      <m-row wrap gap="sm">
        <m-button id="tempo-working" size="sm" variant="secondary" @click="state('working')">{{
          locale === 'pt' ? 'Preparar' : 'Prepare'
        }}</m-button>
        <m-button id="tempo-error" size="sm" variant="secondary" @click="state('error')">{{
          locale === 'pt' ? 'Rever' : 'Reconsider'
        }}</m-button>
        <m-button id="tempo-success" size="sm" variant="secondary" @click="state('success')">{{
          locale === 'pt' ? 'Concluir' : 'Complete'
        }}</m-button>
        <m-button id="tempo-replace" size="sm" variant="ghost" @click="edition++">{{
          locale === 'pt' ? 'Nova edição' : 'New edition'
        }}</m-button>
      </m-row>
      <m-row wrap gap="sm">
        <m-button id="tempo-fling" size="sm" variant="secondary" @click="motion?.fling()">{{
          locale === 'pt' ? 'Dar impulso' : 'Give it momentum'
        }}</m-button>
        <m-button id="tempo-drag" size="sm" variant="ghost" @click="motion?.drag()">{{
          locale === 'pt' ? 'Arrastar livremente' : 'Drag freely'
        }}</m-button>
        <m-button id="tempo-mount" size="sm" variant="ghost" @click="mounted = !mounted">{{
          mounted ? t('Remove') : t('Restore')
        }}</m-button>
      </m-row>
      <m-text id="tempo-checkpoints" variant="caption" tone="muted"
        >{{ checkpoints }}
        {{ locale === 'pt' ? 'encontros no caminho' : 'moments along the way' }}</m-text
      >
      <m-text id="tempo-presses" variant="caption" tone="muted"
        >{{ presses }} {{ locale === 'pt' ? 'toques' : 'presses' }}</m-text
      >
    </m-column>
  </m-screen>
</template>
