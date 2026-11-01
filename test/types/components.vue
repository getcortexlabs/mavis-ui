<script setup lang="ts">
import { MToast, useToast } from '@getcortexlabs/mavis-web'
const toast = useToast()
import { MSelect } from '@getcortexlabs/mavis-web'
import { MToast as NativeToast } from '@getcortexlabs/mavis/vue'
import { MSelect as NativeSelect } from '@getcortexlabs/mavis/vue'
import { ref } from 'vue'
import type {
  InputHandle,
  SheetCloseReason,
  ChoiceValue,
  ChoiceOption,
} from '@getcortexlabs/mavis-core'
import { MInput, MSheet, MSwitch, MCheckbox, MRadioGroup } from '@getcortexlabs/mavis-web'
import {
  MRadioGroup as NativeRadioGroup,
  MCheckbox as NativeCheckbox,
  MInput as NativeInput,
  MSheet as NativeSheet,
  MSwitch as NativeSwitch,
} from '@getcortexlabs/mavis/vue'
import { MButton, MSlider, MReveal, MIcon } from '@getcortexlabs/mavis-web'
import {
  MButton as NativeButton,
  MSlider as NativeSlider,
  MIcon as NativeIcon,
} from '@getcortexlabs/mavis/vue'

const choice = ref<ChoiceValue | null>(null)
const choices: readonly ChoiceOption[] = [
  { value: 1, label: 'One' },
  { value: 'two', label: 'Two', disabled: true },
]
const value = ref(0)
const save = () => {}
const name = ref('')
const input = ref<InputHandle>()
const sheetOpen = ref(false)
const lastClose = ref<SheetCloseReason>()
</script>

<template>
  <NativeToast :controller="toast" />
  <MToast :controller="toast" closeLabel="Close" />
  <m-toast :controller="toast" />
  <!-- @vue-expect-error: Toast needs a controller -->
  <MToast />
  <!-- @vue-expect-error: not an untyped list of messages -->
  <m-toast :controller="[]" />
  <MSelect :options="[{ value: 0, label: 'Zero' }]" label="Interest" :modelValue="null" />
  <NativeSelect
    :options="[{ value: '', label: 'Empty string' }]"
    label="Interest"
    closeLabel="Fechar"
  />
  <m-select :options="[{ value: 1, label: 'One' }]" label="Interest" error="Required" />
  <!-- @vue-expect-error: options are required -->
  <MSelect label="Interest" />
  <!-- @vue-expect-error: a native label is required -->
  <NativeSelect :options="[]" />
  <!-- @vue-expect-error: selection values cannot be boolean -->
  <m-select :options="[]" label="Interest" :modelValue="true" />
  <!-- @vue-expect-error: changes pass a value, not an event -->
  <MSelect
    :options="[]"
    label="Interest"
    @update:modelValue="(event: Event) => event.preventDefault()"
  />
  <MRadioGroup v-model="choice" :options="choices" label="Pace" />
  <NativeRadioGroup v-model="choice" :options="choices" label="Pace" />
  <m-radio-group
    :options="choices"
    label="Pace"
    @update:modelValue="(value: ChoiceValue) => (choice = value)"
  />
  <!-- @vue-expect-error: a group requires options -->
  <MRadioGroup label="Pace" />
  <!-- @vue-expect-error: native group labels are required -->
  <NativeRadioGroup :options="choices" />
  <!-- @vue-expect-error: values cannot be booleans -->
  <m-radio-group :options="choices" label="Pace" :modelValue="false" />
  <!-- @vue-expect-error: option labels are required -->
  <MRadioGroup :options="[{ value: 'one' }]" label="Pace" />

  <MCheckbox v-model="sheetOpen" v-model:indeterminate="sheetOpen" label="All topics" />
  <NativeCheckbox v-model="sheetOpen" indeterminate label="All topics" indeterminateLabel="Mixed" />
  <m-checkbox label="Topic" :width="240" />
  <!-- @vue-expect-error: checked values are boolean -->
  <MCheckbox v-model="value" label="Topic" />
  <!-- @vue-expect-error: native labels are required -->
  <NativeCheckbox />
  <!-- @vue-expect-error: indeterminate is boolean -->
  <m-checkbox label="Topic" indeterminate="mixed" />
  <!-- @vue-expect-error: clearing mixed state emits a boolean -->
  <MCheckbox label="Topic" @update:indeterminate="(event: Event) => event.preventDefault()" />
  <MSwitch v-model="sheetOpen" label="Notifications" helperText="Updates" />
  <NativeSwitch v-model="sheetOpen" label="Notifications" disabled />
  <m-switch v-model="sheetOpen" label="Notifications" width="100%" />
  <!-- @vue-expect-error: switch values are booleans -->
  <MSwitch v-model="value" label="Notifications" />
  <!-- @vue-expect-error: labels are mandatory on both renderers -->
  <NativeSwitch />
  <!-- @vue-expect-error: global switch labels are mandatory -->
  <m-switch />
  <!-- @vue-expect-error: changes pass a boolean, not a platform event -->
  <MSwitch
    label="Notifications"
    @update:modelValue="(event: MouseEvent) => event.preventDefault()"
  />
  <MInput ref="input" v-model="name" label="Name" @submit="name = $event" />
  <NativeInput v-model="name" label="Name" returnKey="next" @submit="input?.focus()" />
  <m-input v-model="name" label="Bio" multiline :rows="4" />
  <!-- @vue-expect-error: input models remain strings -->
  <m-input v-model="value" label="Name" />
  <!-- @vue-expect-error: the label is mandatory for native inputs too -->
  <NativeInput />
  <!-- @vue-expect-error: submit passes text, not a platform event -->
  <MInput label="Name" @submit="(event: KeyboardEvent) => event.preventDefault()" />
  <MSheet v-model:open="sheetOpen" title="Filters" @close="lastClose = $event">
    <m-text>Body</m-text>
  </MSheet>
  <NativeSheet
    :open="sheetOpen"
    accessibilityLabel="Filters"
    :dismissible="false"
    fullscreen
    closeLabel="Fechar"
    @update:open="sheetOpen = $event"
  />
  <m-sheet v-model:open="sheetOpen" title="Filters" gap="sm" padding="md" align="start" />
  <!-- @vue-expect-error: close reports a reason, not a platform event -->
  <MSheet title="Filters" @close="(event: MouseEvent) => event.preventDefault()" />
  <!-- @vue-expect-error: open is a boolean -->
  <m-sheet open="yes" title="Filters" />
  <MScreen scroll :dismissKeyboard="false"><m-text>Composer</m-text></MScreen>
  <!-- @vue-expect-error: dismissKeyboard is a boolean -->
  <m-screen dismissKeyboard="no" />
  <MButton id="save" accessibilityLabel="Save" @click="save">Save</MButton>
  <NativeButton accessibilityLabel="Save" @click="save">Save</NativeButton>
  <MSlider v-model="value" label="Volume" />
  <NativeSlider v-model="value" label="Volume" />
  <MIcon name="search" tone="muted" />
  <MButton icon="plus" @click="save">Add</MButton>
  <NativeButton variant="secondary" trailingIcon="arrow-right">Next</NativeButton>
  <m-button variant="ghost" icon="heart" accessibilityLabel="Favorite" />
  <m-input v-model="name" label="Search" icon="search" trailingIcon="x" />
  <!-- @vue-expect-error: button icons come from the bundled set -->
  <MButton icon="not-an-icon">Add</MButton>
  <!-- @vue-expect-error: input icons are checked too -->
  <m-input v-model="name" label="Search" icon="not-an-icon" />
  <NativeIcon name="heart" size="lg" label="Favorite" />
  <m-icon name="circle-check" :size="32" tone="success" />
  <!-- @vue-expect-error: icon names come from the bundled set -->
  <MIcon name="not-an-icon" />
  <!-- @vue-expect-error: native icon names are checked too -->
  <NativeIcon name="not-an-icon" />
  <!-- @vue-expect-error: the name is mandatory -->
  <m-icon />
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
