<script setup lang="ts">
import { ref } from 'vue'
import { defineTheme, mavis, midnight } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

const { setTheme } = useMavisTheme()
const dark = ref(false)
const disabled = ref(false)
const mounted = ref(true)
const visible = ref(false)
const clicks = ref(0)
const changeTheme = () => {
  dark.value = !dark.value
  setTheme(
    defineTheme(
      {
        name: dark.value ? 'motion-dark' : 'motion-light',
        motion: { pressScale: dark.value ? 0.9 : 0.97 },
      },
      dark.value ? midnight : mavis,
    ),
  )
}
</script>

<template>
  <m-screen>
    <m-column padding="lg" gap="md">
      <m-text variant="overline">MAVIS · MOTION CHECK</m-text>
      <m-text as="h1" variant="heading">Press and reveal</m-text>
      <m-text tone="muted">{{ dark ? 'Midnight · scale 0.90' : 'Mavis · scale 0.97' }}</m-text>
      <m-column v-if="mounted" gap="md">
        <m-button id="motion-button" :disabled="disabled" @click="clicks++"
          >Hold the button</m-button
        >
        <m-card
          id="motion-card"
          interactive
          :disabled="disabled"
          accessibilityLabel="Hold the card"
          @click="clicks++"
        >
          <m-text variant="heading">Hold the card</m-text>
          <m-text tone="muted">The whole surface responds.</m-text>
        </m-card>
        <m-reveal id="motion-content" :show="visible">
          <m-card gap="sm">
            <m-text variant="heading">A little more context.</m-text>
            <m-button variant="secondary" @click="clicks++">Inside the reveal</m-button>
          </m-card>
        </m-reveal>
      </m-column>
      <m-text id="motion-count">{{ clicks }} activations</m-text>
      <m-row gap="sm">
        <m-button :grow="1" variant="secondary" @click="visible = !visible">{{
          visible ? 'Hide content' : 'Show content'
        }}</m-button>
        <m-button :grow="1" variant="secondary" @click="changeTheme">Change theme</m-button>
      </m-row>
      <m-row gap="sm">
        <m-button :grow="1" variant="ghost" @click="disabled = !disabled">{{
          disabled ? 'Enable feedback' : 'Disable feedback'
        }}</m-button>
        <m-button :grow="1" variant="ghost" @click="mounted = !mounted">{{
          mounted ? 'Unmount' : 'Mount'
        }}</m-button>
      </m-row>
    </m-column>
  </m-screen>
</template>
