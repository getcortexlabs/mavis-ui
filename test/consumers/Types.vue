<script setup lang="ts">
import { MButton, MInput, MSlider, MSwitch } from 'mavis-renderer'
</script>

<template>
  <MButton variant="primary">Direct import</MButton>
  <m-button variant="secondary">Global registration</m-button>
  <MInput label="Name" />
  <MSlider label="Volume" />
  <MSwitch :modelValue="true" label="Notifications" />
  <m-switch label="Digest" />
  <!-- @vue-expect-error: switch models are booleans in published declarations -->
  <MSwitch :modelValue="1" label="Notifications" />
  <!-- @vue-expect-error: direct imports retain the variant union -->
  <MButton variant="missing" />
  <!-- @vue-expect-error: global registration retains the variant union -->
  <m-button variant="missing" />
  <!-- @vue-expect-error: input labels are mandatory -->
  <MInput />
  <!-- @vue-expect-error: global slider labels are mandatory -->
  <m-slider />
</template>
