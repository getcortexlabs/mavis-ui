<script setup lang="ts">
import { markRaw, onBeforeUnmount, ref } from 'vue'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { useMavisListMotion, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useCatalogLocale } from '../locale'
import {
  courierPath,
  liftCard,
  recallCourier,
  sendCourier,
  tiltPanel,
  turnPanel,
} from '../depth-motion'

const { t } = useCatalogLocale()
const { theme } = useMavisTheme()
const courier = markRaw(createMotionSurface())
const panel = markRaw(createMotionSurface())
const card = markRaw(createMotionSurface())
const route = ref('Waiting at the start')
const tilted = ref(false)
const raised = ref(false)
const shadow = ref<boolean>()
const mounted = ref(true)
const failure = ref('')
const list = useMavisListMotion({ size: false, transition: { duration: 260 } })
const order = ref<('card' | 'note')[]>(['card', 'note'])
const swap = () => list.update(() => order.value.reverse())
let trip = 0
const send = () => {
  const current = ++trip
  route.value = 'On the way'
  void sendCourier(courier).finished.then((finished) => {
    if (current === trip) route.value = finished ? 'Delivered' : 'Stopped on the way'
  })
}
const hold = () => {
  trip++
  const playback = sendCourier(courier)
  playback.pause()
  playback.progress = 0.5
  route.value = 'Held halfway'
}
const recall = () => {
  trip++
  recallCourier(courier)
  route.value = 'Waiting at the start'
}
const tilt = () => {
  tilted.value = !tilted.value
  tiltPanel(panel, tilted.value)
}
const lift = () => {
  raised.value = !raised.value
  shadow.value = card.supports('shadow')
  liftCard(card, theme.value, raised.value)
}
const conflict = () => {
  try {
    courier.animate({ path: courierPath, x: 40 })
    failure.value = 'Accepted'
  } catch (error) {
    failure.value = (error as Error).message
  }
}
const stop = card.onAvailable(() => {
  shadow.value = card.supports('shadow')
})
onBeforeUnmount(() => {
  trip++
  stop()
})
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg">
      <m-column gap="xs">
        <m-text variant="overline">MAVIS · {{ t('Depth check') }}</m-text>
        <m-text as="h1" variant="heading">{{ t('Paths, depth and shadows') }}</m-text>
      </m-column>
      <m-card v-if="mounted" gap="md">
        <m-text variant="heading">{{ t('Along a path') }}</m-text>
        <m-column :height="120" :paddingX="12" :paddingY="12" justify="end" align="start">
          <m-box
            id="depth-courier"
            :motionSurface="courier"
            :width="36"
            :height="20"
            radius="sm"
            :backgroundColor="theme.colors.primary"
            accessibilityHidden
          />
        </m-column>
        <m-text id="depth-route" variant="caption" tone="muted">{{ t(route) }}</m-text>
        <m-text id="depth-bounds" variant="caption" tone="muted"
          >{{ t('Stays inside') }} {{ courierPath.bounds.left }}…{{ courierPath.bounds.right }} ×
          {{ courierPath.bounds.top }}…{{ courierPath.bounds.bottom }}</m-text
        >
        <m-row gap="sm" wrap>
          <m-button @click="send">{{ t('Send') }}</m-button>
          <m-button variant="secondary" @click="hold">{{ t('Hold halfway') }}</m-button>
          <m-button variant="secondary" @click="recall">{{ t('Bring back') }}</m-button>
          <m-button variant="ghost" @click="conflict">{{ t('Path with x') }}</m-button>
        </m-row>
        <m-text v-if="failure" id="depth-failure" variant="caption" tone="muted">{{
          failure
        }}</m-text>
      </m-card>
      <m-column v-if="mounted" gap="md">
        <m-text variant="heading">{{ t('Around an axis') }}</m-text>
        <m-box id="depth-stage" :perspective="640" :paddingY="12" :paddingX="24">
          <m-card id="depth-panel" :motionSurface="panel" gap="xs">
            <m-text variant="heading">{{ t('A card with depth') }}</m-text>
            <m-text tone="muted">{{ t('The box around it owns the perspective.') }}</m-text>
          </m-card>
        </m-box>
        <m-row gap="sm" wrap>
          <m-button variant="secondary" @click="tilt">{{ t(tilted ? 'Level' : 'Tilt') }}</m-button>
          <m-button variant="ghost" :disabled="!tilted" @click="turnPanel(panel)">{{
            t('Turn the other way')
          }}</m-button>
        </m-row>
      </m-column>
      <m-column v-if="mounted" gap="md">
        <m-text variant="heading">{{ t('With a shadow') }}</m-text>
        <m-column :motionRegion="list.region" gap="md" :paddingY="12" :paddingX="24">
          <template v-for="item in order" :key="item">
            <m-box v-if="item === 'card'">
              <m-card
                id="depth-card"
                :motionSurface="card"
                elevation="sm"
                gap="xs"
                interactive
                :accessibilityLabel="t('A card that lifts')"
                @click="lift"
              >
                <m-text variant="heading">{{ t('A card that lifts') }}</m-text>
                <m-text id="depth-shadow" tone="muted">{{
                  t(
                    shadow === undefined
                      ? 'Checking the shadow'
                      : shadow
                        ? 'The shadow follows the card.'
                        : 'The shadow stays as the theme drew it.',
                  )
                }}</m-text>
              </m-card>
            </m-box>
            <m-card v-else id="depth-note" gap="xs">
              <m-text tone="muted">{{ t('A neighbour that trades places.') }}</m-text>
            </m-card>
          </template>
        </m-column>
        <m-row gap="sm" wrap>
          <m-button variant="secondary" @click="lift">{{ t(raised ? 'Lower' : 'Lift') }}</m-button>
          <m-button variant="ghost" @click="swap">{{ t('Trade places') }}</m-button>
        </m-row>
      </m-column>
      <m-button variant="ghost" @click="mounted = !mounted">{{
        t(mounted ? 'Unmount' : 'Mount')
      }}</m-button>
    </m-column>
  </m-screen>
</template>
