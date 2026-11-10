<script setup lang="ts">
import { useCatalogLocale } from './locale'
import { markRaw, onBeforeUnmount, ref, shallowRef } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import {
  createMotionRegion,
  createMotionSurface,
  createMotionScrollSource,
  whenMotionAvailable,
  type MotionDiagnostics,
  type MotionSharedLayout,
} from '@getcortexlabs/mavis-core/experimental'
import { afterglowMotion } from './afterglow-motion'

const { t } = useCatalogLocale()

const props = defineProps<{ debug?: boolean }>()
const { theme } = useMavisTheme()
const region = markRaw(createMotionRegion())
const card = markRaw(createMotionSurface())
const edition = markRaw(createMotionSurface())
const entrances = markRaw(createMotionRegion())
const source = markRaw(createMotionScrollSource())
const panels = shallowRef([0, 1, 2].map(() => markRaw(createMotionSurface())))
const overlaySurface = markRaw(createMotionSurface())
const portraitRegion = markRaw(createMotionRegion())
const portrait = markRaw(createMotionSurface())
const expanded = ref(false),
  viewer = ref(false),
  sheet = ref(false),
  mounted = ref(true)
const period = ref<string | number | null>('evening')
const transitionStatus = ref('Ready'),
  snapshot = ref('{}'),
  pointerState = ref('null')
let diagnostics: MotionDiagnostics | undefined, portraitLayout: MotionSharedLayout | undefined
const motion = afterglowMotion(region, card, edition)
let releaseHorizontal: (() => void) | undefined
const subscriptions = [
  whenMotionAvailable([entrances, source, ...panels.value], () => {
    entrances.viewportEnter(panels.value, {
      root: source,
      threshold: 0.15,
      once: false,
      stagger: 90,
    })
  }),
  whenMotionAvailable([source, overlaySurface], () =>
    overlaySurface.use((owner) => {
      owner.set({ scale: 1.01 })
      owner.scrollLinked(source, { opacity: [0.92, 1] }, { range: [0, 600] })
    }),
  ),
  portraitRegion.onAvailable(() => {
    portraitLayout = portraitRegion.sharedLayout({ transition: { duration: 420 } })
    portraitLayout.attach(portrait, 'portrait')
    return () => {
      portraitLayout = undefined
    }
  }),
  region.onAvailable(() => {
    if (props.debug)
      diagnostics = region.diagnostics({
        development: true,
        identity: 'afterglow-edition',
        maxEvents: 80,
      })
  }),
]
function expand() {
  const handle = motion.transition(() => {
    expanded.value = !expanded.value
  })
  transitionStatus.value = 'Moving'
  void handle?.finished.then((result) => {
    transitionStatus.value = `${result.status}${result.reason ? `: ${result.reason}` : ''}`
  })
}
function showPortrait() {
  if (portraitLayout)
    portraitLayout.transition(() => {
      viewer.value = !viewer.value
    })
  else viewer.value = !viewer.value
}
function stopPointer() {
  motion.stopPointer()
}
function replaceHorizontal() {
  releaseHorizontal?.()
  releaseHorizontal = card.use((owner) => {
    owner.set({ x: 6 })
  })
}
function cancelTransition() {
  motion.cancel()
}
function readSnapshot() {
  pointerState.value = JSON.stringify(motion.pointer())
  const current = diagnostics?.snapshot()
  snapshot.value = JSON.stringify(
    current
      ? { ...current, eventCount: current.events.length, events: current.events.slice(-3) }
      : { disposed: true },
  )
}
onBeforeUnmount(() => {
  releaseHorizontal?.()
  motion.dispose()
  subscriptions.forEach((stop) => stop())
})
</script>

<template>
  <m-screen scroll :motionScroll="source" id="afterglow-screen">
    <m-column padding="lg" gap="xl" class="showcase-container">
      <m-row justify="between" align="center" gap="md">
        <m-text variant="overline" tone="primary">{{ t('12 / AFTERGLOW') }}</m-text>
        <m-badge :text="t('An evening, collected')" tone="accent" />
      </m-row>
      <m-column gap="sm">
        <m-text as="h1" variant="display">{{ t('Stay for the light.') }}</m-text>
        <m-text tone="muted">{{ t('Art, conversation, and the hours in between.') }}</m-text>
      </m-column>
      <m-box :motionRegion="region" id="afterglow-region" padding="sm">
        <m-column gap="lg" padding="sm">
          <m-card
            v-if="mounted"
            :motionSurface="edition"
            id="afterglow-layout"
            padding="none"
            radius="none"
            elevation="none"
            backgroundColor="transparent"
            :style="{ borderWidth: 0 }"
          >
            <m-card
              :motionSurface="card"
              id="afterglow-edition"
              :height="expanded ? 430 : 310"
              interactive
              :accessibilityLabel="
                t(expanded ? 'Return to the evening edition' : 'Explore the evening edition')
              "
              :backgroundColor="theme.colors.primarySoft"
              padding="lg"
              gap="lg"
              @click="expand"
            >
              <m-row justify="between">
                <m-text variant="overline" tone="primary">{{ t('THE EVENING EDITION') }}</m-text>
                <m-text variant="heading" tone="primary">↗</m-text>
              </m-row>
              <m-row align="center" gap="lg">
                <m-box
                  :width="92"
                  :height="92"
                  radius="full"
                  :backgroundColor="theme.colors.primary"
                >
                  <m-column align="center" justify="center"
                    ><m-text variant="display" tone="onPrimary">{{ t('a.') }}</m-text></m-column
                  >
                </m-box>
                <m-column gap="xs" :grow="1" :width="0">
                  <m-text variant="heading">{{ t('A softer kind of night.') }}</m-text>
                  <m-text variant="caption" tone="primary">{{ t('NOV 21 · 18:30 — LATE') }}</m-text>
                </m-column>
              </m-row>
              <m-text v-if="expanded" tone="primary">{{
                t(
                  'An open studio. New work on the walls. A table with room for one more. Come curious; leave with a story.',
                )
              }}</m-text>
              <m-text variant="caption" tone="primary">{{ t('STUDIO 04 / SÃO PAULO') }}</m-text>
            </m-card>
          </m-card>
          <m-row gap="sm" wrap>
            <m-button variant="ghost" @click="expand">{{
              t(expanded ? 'Back to the edition' : 'Explore the edition')
            }}</m-button>
            <m-button variant="secondary" @click="sheet = true">{{
              t('Plan your evening')
            }}</m-button>
          </m-row>
        </m-column>
      </m-box>
      <m-card :motionSurface="overlaySurface" gap="md" :backgroundColor="theme.colors.accentSoft">
        <m-text variant="overline" tone="accent">{{ t('MAKE IT YOURS') }}</m-text>
        <m-select
          v-model="period"
          :label="t('Your arrival')"
          :options="[
            { value: 'evening', label: t('First light · 18:30') },
            { value: 'late', label: t('After hours · 20:30') },
          ]"
        />
        <m-sheet
          v-model:open="sheet"
          :title="t('A little room for possibility')"
          :closeLabel="t('Close evening plan')"
        >
          <m-column gap="md" padding="lg">
            <m-text>{{ t('Doors open at 18:30. Stay as long as the conversation lasts.') }}</m-text>
            <m-input
              :label="t('A note for the host')"
              :placeholder="t('Anything we should know?')"
            />
            <m-button @click="sheet = false">{{ t('See you there') }}</m-button>
          </m-column>
        </m-sheet>
      </m-card>
      <m-box :motionRegion="portraitRegion">
        <m-column gap="md">
          <m-text variant="overline" tone="accent">{{ t('IN GOOD COMPANY') }}</m-text>
          <m-card
            :motionSurface="portrait"
            id="afterglow-portrait"
            :height="viewer ? 220 : 110"
            padding="md"
            gap="sm"
            interactive
            :accessibilityLabel="t('Meet the artist')"
            @click="showPortrait"
          >
            <m-row gap="lg" align="center">
              <m-avatar
                name="Mavis"
                :size="viewer ? 'xl' : 'md'"
                :src="'https://mavis-ui.getcortexlabs.com/images/mavis.webp'"
              />
              <m-column :grow="1" :width="0" gap="xs"
                ><m-text variant="heading">{{ t('Mavis') }}</m-text
                ><m-text tone="muted">{{ t('Artist in residence') }}</m-text></m-column
              >
            </m-row>
            <m-text v-if="viewer" tone="muted">{{
              t('Finding the extraordinary in the everyday. A new collection, seen up close.')
            }}</m-text>
          </m-card>
        </m-column>
      </m-box>
      <m-box :motionRegion="entrances">
        <m-column gap="md">
          <m-text variant="title">{{ t('Let the evening unfold.') }}</m-text>
          <m-card
            v-for="(item, index) in [
              {
                time: '18:30',
                title: 'The doors open.',
                copy: 'Take a look around. Find your first conversation.',
              },
              {
                time: '19:30',
                title: 'A different perspective.',
                copy: 'Meet the artists and the stories behind the work.',
              },
              {
                time: '20:30',
                title: 'One more story.',
                copy: 'Good music, warm light, and no reason to rush.',
              },
            ]"
            :key="item.time"
            :motionSurface="panels[index]"
            :id="`afterglow-stop-${index}`"
            padding="lg"
            gap="md"
          >
            <m-text variant="overline" tone="primary">{{ t(item.time) }}</m-text>
            <m-text variant="heading">{{ t(item.title) }}</m-text>
            <m-text tone="muted">{{ t(item.copy) }}</m-text>
          </m-card>
        </m-column>
      </m-box>
      <m-column v-if="debug" gap="sm" id="afterglow-debug">
        <m-text variant="heading">{{ t('Motion diagnostics · development only') }}</m-text>
        <m-text id="afterglow-status">{{ t(transitionStatus) }}</m-text>
        <m-row gap="sm" wrap>
          <m-button size="sm" @click="readSnapshot">{{ t('Read snapshot') }}</m-button>
          <m-button size="sm" @click="stopPointer">{{ t('Remove pointer owner') }}</m-button>
          <m-button size="sm" @click="replaceHorizontal">{{
            t('Replace horizontal owner')
          }}</m-button>
          <m-button size="sm" @click="cancelTransition">{{ t('Cancel transition') }}</m-button>
          <m-button size="sm" @click="mounted = !mounted">{{
            t(mounted ? 'Remove surface' : 'Restore surface')
          }}</m-button>
        </m-row>
        <m-text id="afterglow-pointer" variant="caption">{{ pointerState }}</m-text>
        <m-text id="afterglow-snapshot" variant="caption">{{ t(snapshot) }}</m-text>
      </m-column>
      <m-text variant="caption" tone="muted">{{
        t('An imagined evening. A real shared interface.')
      }}</m-text>
    </m-column>
  </m-screen>
</template>
