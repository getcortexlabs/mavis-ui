<script setup lang="ts">
import { MChip as NativeChip, MEmptyState as NativeEmptyState } from '@getcortexlabs/mavis/vue'
import { MChip, MEmptyState } from '@getcortexlabs/mavis-web'
import { MAccordion, MSegmentedControl } from '@getcortexlabs/mavis-web'
import {
  MAccordion as NativeAccordion,
  MSegmentedControl as NativeSegmentedControl,
} from '@getcortexlabs/mavis/vue'

import { MProgress, MAlert } from '@getcortexlabs/mavis-web'
import { MProgress as NativeProgress, MAlert as NativeAlert } from '@getcortexlabs/mavis/vue'

import { MListItem, MSeparator } from '@getcortexlabs/mavis-web'
import {
  MListItem as NativeListItem,
  MSeparator as NativeSeparator,
} from '@getcortexlabs/mavis/vue'

import { MAvatar, MBadge } from '@getcortexlabs/mavis-web'
import { MAvatar as NativeAvatar, MBadge as NativeBadge } from '@getcortexlabs/mavis/vue'
import { MSkeleton } from '@getcortexlabs/mavis-web'
import { MSkeleton as NativeSkeleton } from '@getcortexlabs/mavis/vue'
import { MTabs } from '@getcortexlabs/mavis-web'
import { MTabs as NativeTabs } from '@getcortexlabs/mavis/vue'
import { MDialog } from '@getcortexlabs/mavis-web'
import { MDialog as NativeDialog } from '@getcortexlabs/mavis/vue'
import { MToast, useToast } from '@getcortexlabs/mavis-web'
const toast = useToast()
import { MSelect } from '@getcortexlabs/mavis-web'
import { MToast as NativeToast } from '@getcortexlabs/mavis/vue'
import { MSelect as NativeSelect } from '@getcortexlabs/mavis/vue'
import { ref, useTemplateRef } from 'vue'
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

const inferredInput = ref<InstanceType<typeof MInput>>()
const inferredTemplate = useTemplateRef('inferredTemplate')
const globalTemplate = useTemplateRef('globalTemplate')
const portableInput = ref<InputHandle>()
inferredInput.value?.focus()
inferredInput.value?.blur()
inferredTemplate.value?.focus()
inferredTemplate.value?.blur()
globalTemplate.value?.focus()
globalTemplate.value?.blur()
portableInput.value?.focus()
portableInput.value?.blur()
// @ts-expect-error: the portable handle does not expose the editor
inferredInput.value?.editor
const nativeInput = ref<InstanceType<typeof NativeInput>>()
const nativeTemplate = useTemplateRef('nativeTemplate')
nativeInput.value?.focus()
nativeInput.value?.blur()
nativeTemplate.value?.focus()
nativeTemplate.value?.blur()
</script>

<template>
  <MInput
    label="Action"
    :trailingAction="{ icon: 'eye', label: 'Show password' }"
    @action="() => {}"
  />
  <m-input label="Action" :trailingAction="{ icon: 'x', label: 'Clear', disabled: true }" />
  <!-- @vue-expect-error: actions need an accessible label -->
  <MInput label="Invalid" :trailingAction="{ icon: 'eye' }" />
  <!-- @vue-expect-error: action sends no platform event -->
  <m-input label="Invalid" @action="(event: MouseEvent) => event.preventDefault()" />
  <MSheet title="Named" />
  <MSheet accessibilityLabel="Named without heading" />
  <m-sheet accessibilityLabel="Global without heading" />
  <!-- @vue-expect-error: even closed sheets need a name -->
  <MSheet :open="false" />
  <!-- @vue-expect-error: globally registered sheets also need a name -->
  <m-sheet />
  <NativeSheet title="Native named" />
  <NativeSheet accessibilityLabel="Native without heading" />
  <!-- @vue-expect-error: native sheets need a name -->
  <NativeSheet />

  <MInput
    ref="inferredInput"
    label="Typed instance"
    name="email"
    autocomplete="email"
    inputmode="email"
    required
    form="account"
  />
  <MInput ref="inferredTemplate" label="Inferred template" />
  <m-input ref="globalTemplate" label="Inferred global" name="bio" multiline required />
  <MInput ref="portableInput" label="Portable handle" />
  <MButton type="submit">Submit</MButton>
  <m-button type="reset">Reset</m-button>
  <!-- @vue-expect-error: button types follow HTML's three actions -->
  <MButton type="link" />
  <!-- @vue-expect-error: global buttons preserve the type union -->
  <m-button type="invalid" />
  <!-- @vue-expect-error: inputmode is a browser keyboard hint -->
  <MInput label="Invalid inputmode" inputmode="number" />
  <!-- @vue-expect-error: required is boolean -->
  <m-input label="Invalid required" required="yes" />
  <NativeInput ref="nativeTemplate" label="Native inferred" />

  <NativeChip label="Native" selectable />
  <NativeEmptyState title="Nothing saved" />
  <MChip
    label="Design"
    selectable
    :modelValue="true"
    @update:modelValue="(value) => value satisfies boolean"
  />
  <m-chip label="Vue" removable removeLabel="Remove Vue" @remove="() => {}" />
  <MEmptyState title="Nothing saved" titleAs="h3"
    ><template #illustration><span /></template
    ><template #actions><m-button>Explore</m-button></template></MEmptyState
  >
  <m-empty-state title="Empty" compact />
  <!-- @vue-expect-error: nonempty label is required -->
  <MChip />
  <!-- @vue-expect-error: boolean selection only -->
  <m-chip label="Design" modelValue="yes" />
  <!-- @vue-expect-error: title is required -->
  <MEmptyState />
  <!-- @vue-expect-error: headings only -->
  <m-empty-state title="Empty" titleAs="div" />
  <MAccordion :items="[{ value: 0, title: 'Question' }]" :modelValue="[0]" label="Help"
    ><template #default="{ item }">{{ item.value satisfies string | number }}</template></MAccordion
  >
  <m-accordion :items="[]" label="Empty" multiple />
  <MSegmentedControl :options="[{ value: 0, label: 'Number' }]" :modelValue="0" label="Period" />
  <m-segmented-control :options="[]" label="Empty" />
  <!-- @vue-expect-error: array model even in single mode -->
  <MAccordion :items="[]" :modelValue="0" label="Help" />
  <!-- @vue-expect-error: item title is required -->
  <m-accordion :items="[{ value: 'a' }]" label="Help" />
  <!-- @vue-expect-error: group label is required -->
  <MSegmentedControl :options="[]" />
  <!-- @vue-expect-error: scalar model, no multiselection -->
  <m-segmented-control :options="[]" :modelValue="[]" label="Period" />
  <!-- @vue-expect-error: update receives values, not a browser event -->
  <MAccordion
    :items="[]"
    label="Help"
    @update:modelValue="(event: MouseEvent) => event.preventDefault()"
  />

  <NativeAccordion :items="[{ value: 'a', title: 'Question' }]" label="Help"
    ><template #default="{ item }">{{ item.title satisfies string }}</template></NativeAccordion
  >
  <NativeSegmentedControl :options="[]" label="Period" />
  <!-- @vue-expect-error: native also requires a group label -->
  <NativeAccordion :items="[]" />

  <MProgress :value="32" :max="64" label="Download" tone="accent" />
  <m-progress label="Preparing" indeterminate indeterminateLabel="Preparing files" />
  <MAlert title="Saved" tone="success" dismissible @close="() => {}">
    <template #actions><m-button>View</m-button></template>
  </MAlert>
  <m-alert title="Information" :announce="true" />
  <!-- @vue-expect-error: an accessible name is required -->
  <MProgress />
  <!-- @vue-expect-error: progress sizes use fixed tokens -->
  <m-progress label="Download" size="huge" />
  <!-- @vue-expect-error: alert title is required -->
  <MAlert />
  <!-- @vue-expect-error: alert tones use error, not danger -->
  <m-alert title="Error" tone="danger" />
  <!-- @vue-expect-error: close has no event payload -->
  <MAlert title="Saved" @close="(event: MouseEvent) => event.preventDefault()" />
  <NativeProgress label="Download" :value="10" />
  <NativeAlert title="Native notice" />

  <MListItem title="Marina" description="Design" interactive @click="() => {}">
    <template #leading><m-avatar name="Marina" /></template>
    <template #trailing><m-badge text="Available" /></template>
  </MListItem>
  <m-list-item title="Static"
    ><template #trailing><m-button>Action</m-button></template></m-list-item
  >
  <MSeparator orientation="vertical" :length="32" spacing="sm" inset="xs" />
  <m-separator :spacing="12" />
  <!-- @vue-expect-error: title is required -->
  <MListItem />
  <!-- @vue-expect-error: click has no event payload -->
  <MListItem title="Action" interactive @click="(event: MouseEvent) => event.preventDefault()" />
  <!-- @vue-expect-error: orientation must be horizontal or vertical -->
  <m-separator orientation="diagonal" />
  <!-- @vue-expect-error: length is an explicit number, not a percentage -->
  <MSeparator length="50%" />
  <NativeListItem title="Native"
    ><template #leading><m-icon name="user-round" /></template
  ></NativeListItem>
  <NativeSeparator :length="32" />

  <MAvatar name="Marina Costa" size="xl" shape="square" />
  <NativeAvatar src="~/avatar.png" name="Marina" />
  <m-avatar name="Mavis" :accessibilityHidden="true" />
  <MBadge :text="0" tone="accent" />
  <NativeBadge text="Ready" size="sm" />
  <m-badge text="New" tone="primary" />
  <!-- @vue-expect-error: fixed avatar size tokens -->
  <MAvatar :size="45" />
  <!-- @vue-expect-error: shape uses circle or square -->
  <m-avatar shape="triangle" />
  <!-- @vue-expect-error: badge content is required -->
  <MBadge />
  <!-- @vue-expect-error: badge tone must be a semantic tone -->
  <m-badge text="Wrong" tone="pink" />
  <NativeSkeleton :height="24" radius="md" />
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
  <NativeTabs :tabs="[{ value: 1, label: 'One' }]" :modelValue="1" label="Native sections"
    ><template #default="{ value }">{{ value satisfies string | number }}</template></NativeTabs
  >
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
  <NativeDialog title="Native" />
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
