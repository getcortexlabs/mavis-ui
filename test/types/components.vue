<script setup lang="ts">
import { ref } from 'vue'
import type { InputHandle } from '@getcortexlabs/mavis-core'
import { MInput } from '@getcortexlabs/mavis-web'
import { MInput as NativeInput } from '@getcortexlabs/mavis/vue'
import { MButton, MSlider, MReveal } from '@getcortexlabs/mavis-web'
import { MButton as NativeButton, MSlider as NativeSlider } from '@getcortexlabs/mavis/vue'

const value = ref(0)
const save = () => {}
const name = ref('')
const input = ref<InputHandle>()
</script>

<template>
  <MInput ref="input" v-model="name" label="Name" @submit="name = $event" />
  <NativeInput v-model="name" label="Name" returnKey="next" @submit="input?.focus()" />
  <m-input v-model="name" label="Bio" multiline :rows="4" />
  <!-- @vue-expect-error: input models remain strings -->
  <m-input v-model="value" label="Name" />
  <!-- @vue-expect-error: the label is mandatory for native inputs too -->
  <NativeInput />
  <!-- @vue-expect-error: submit passes text, not a platform event -->
  <MInput label="Name" @submit="(event: KeyboardEvent) => event.preventDefault()" />
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
