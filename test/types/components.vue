<script setup lang="ts">
import { ref } from 'vue'
import { MButton, MSlider, MReveal } from '@mavis-ui/web'
import { MButton as NativeButton, MSlider as NativeSlider } from '@mavis-ui/nativescript/vue'

const value = ref(0)
const save = () => {}
</script>

<template>
  <MButton id="save" accessibilityLabel="Save" @click="save">Save</MButton>
  <NativeButton accessibilityLabel="Save" @click="save">Save</NativeButton>
  <MSlider v-model="value" label="Volume" />
  <NativeSlider v-model="value" label="Volume" />
  <MReveal show gap="sm" padding="md" align="end"><m-text>Details</m-text></MReveal>
  <m-row width="50%" :grow="1"><m-text :accessibilityHidden="true">Decorative</m-text></m-row>
  <!-- @vue-expect-error: the same variants are enforced for direct imports -->
  <MButton variant="missing" />
  <!-- @vue-expect-error: native direct imports have the same variants -->
  <NativeButton variant="missing" />
  <!-- @vue-expect-error: the label is mandatory -->
  <MSlider />
  <!-- @vue-expect-error: native labels are mandatory too -->
  <NativeSlider />
  <!-- @vue-expect-error: global component declarations share the runtime props -->
  <m-button variant="missing" />
  <!-- @vue-expect-error: global sliders also require a label -->
  <m-slider />
  <!-- @vue-expect-error: platform CSS units are not portable dimensions -->
  <m-box width="12rem" />
  <!-- @vue-expect-error: clicks have no platform event payload -->
  <MButton @click="(event: MouseEvent) => event.preventDefault()" />
</template>
