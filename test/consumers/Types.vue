<script setup lang="ts">
import { MSkeleton } from 'mavis-renderer'
import { MTabs } from 'mavis-renderer'
import { MDialog } from 'mavis-renderer'
import { MToast, useToast } from 'mavis-renderer'
const toast = useToast()
import { MSelect, MButton, MInput, MSlider, MSwitch, MCheckbox, MRadioGroup } from 'mavis-renderer'
</script>

<template>
  <MSkeleton :width="48" :height="48" radius="full" :animated="false" />
  <m-skeleton width="70%" :height="12" :grow="1" />
  <!-- @vue-expect-error: dimensions use numbers, percentages or auto -->
  <MSkeleton width="48px" />
  <!-- @vue-expect-error: radius must be a token or number -->
  <m-skeleton radius="rounded" />
  <!-- @vue-expect-error: animated must be boolean -->
  <MSkeleton animated="yes" />
  <MTabs :tabs="[{ value: 0, label: 'Zero' }]" :modelValue="0" label="Sections">
    <template #default="{ value }">{{ value satisfies string | number }}</template>
  </MTabs>
  <m-tabs :tabs="[{ value: 'a', label: 'A' }]" label="Sections">
    <template #default="{ value }">{{ value satisfies string | number }}</template>
  </m-tabs>
  <!-- @vue-expect-error: tabs require their accessible label -->
  <MTabs :tabs="[]" />
  <!-- @vue-expect-error: model values must be strings, numbers or null -->
  <m-tabs :tabs="[]" label="Sections" :modelValue="true" />
  <!-- @vue-expect-error: activation sends a value, not an event -->
  <MTabs
    :tabs="[]"
    label="Sections"
    @update:modelValue="(event: MouseEvent) => event.preventDefault()"
  />
  <MDialog
    title="Confirm"
    :open="false"
    tone="danger"
    @close="(reason: import('@getcortexlabs/mavis-core').DialogCloseReason) => reason"
  />
  <m-dialog title="Confirm" :loading="true" loadingLabel="Saving" />
  <!-- @vue-expect-error: a dialog needs its title -->
  <MDialog />
  <!-- @vue-expect-error: unknown tone -->
  <m-dialog title="Confirm" tone="success" />
  <!-- @vue-expect-error: close sends a reason, not a DOM event -->
  <MDialog title="Confirm" @close="(event: MouseEvent) => event.preventDefault()" />
  <MToast :controller="toast" closeLabel="Close" />
  <m-toast :controller="toast" />
  <!-- @vue-expect-error: Toast needs a controller -->
  <MToast />
  <!-- @vue-expect-error: not an untyped list of messages -->
  <m-toast :controller="[]" />
  <MSelect :options="[{ value: 0, label: 'Zero' }]" label="Interest" :modelValue="null" />
  <MSelect :options="[{ value: '', label: 'Empty string' }]" label="Interest" closeLabel="Fechar" />
  <m-select :options="[{ value: 1, label: 'One' }]" label="Interest" error="Required" />
  <!-- @vue-expect-error: options are required -->
  <MSelect label="Interest" />
  <!-- @vue-expect-error: a native label is required -->
  <MSelect :options="[]" />
  <!-- @vue-expect-error: selection values cannot be boolean -->
  <m-select :options="[]" label="Interest" :modelValue="true" />
  <!-- @vue-expect-error: changes pass a value, not an event -->
  <MSelect
    :options="[]"
    label="Interest"
    @update:modelValue="(event: Event) => event.preventDefault()"
  />
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
