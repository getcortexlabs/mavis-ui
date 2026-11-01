<script setup lang="ts">
import { MButton, MInput, MSlider, MSwitch, MCheckbox, MRadioGroup } from 'mavis-renderer'
</script>

<template>
  <MRadioGroup label="Pace" :options="[{ value: 0, label: 'Zero' }]" :modelValue="0" />
  <m-radio-group label="Pace" :options="[{ value: 'a', label: 'A' }]" />
  <!-- @vue-expect-error: Radio models cannot be objects -->
  <MRadioGroup label="Pace" :options="[]" :modelValue="{}" />

  <MButton variant="primary">Direct import</MButton>
  <m-button variant="secondary">Global registration</m-button>
  <MInput label="Name" />
  <MSlider label="Volume" />
  <MCheckbox label="Topic" indeterminate />
  <m-checkbox label="Topic" :modelValue="true" />
  <!-- @vue-expect-error: Checkbox keeps a boolean model in published declarations -->
  <MCheckbox label="Topic" :modelValue="1" />
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
