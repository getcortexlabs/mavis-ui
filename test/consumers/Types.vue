<script setup lang="ts">
import { MPopover, MMenu, MAppBar, MTabBar, MTimePicker, MVirtualList } from 'mavis-renderer'
const collectionItems = ref([{ id: 1, title: 'One' }])
const timeValue = ref<string | null>('09:30')
const timeControl = ref<InstanceType<typeof MTimePicker>>()
timeControl.value?.focus()
timeControl.value?.blur()

import { MThemeProvider, MText, MSpan, MCard, MGrid, MImage } from 'mavis-renderer'
import { mavis, midnight } from '@getcortexlabs/mavis-core'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
const motionSurface = createMotionSurface()
const cardSurface = createMotionSurface()
cardSurface.onAvailable(() => {
  const input = cardSurface.motionValue(1)
  const spring = cardSurface.springValue(input, { stiffness: 180, damping: 22 })
  const binding = cardSurface.bind({
    scale: spring,
    y: spring.to([0, 1], [20, 0]),
    opacity: input.to([0, 1], [0, 1]),
  })
  const drag = cardSurface.drag({
    axis: 'x',
    bounds: { left: -40, right: 40 },
    snap: { x: [-40, 0, 40] },
  })
  input.set(1.08)
  spring.pause()
  spring.resume()
  drag.cancel()
  // @ts-expect-error: only an input can drive the portable follower
  cardSurface.springValue(spring)
  // @ts-expect-error: numeric values only
  cardSurface.motionValue('1')
  return () => {
    binding.dispose()
    drag.dispose()
    input.dispose()
  }
})
import { ref, useTemplateRef } from 'vue'
import type { InputHandle } from '@getcortexlabs/mavis-core'
import { MChip, MEmptyState } from 'mavis-renderer'
import { MAccordion, MSegmentedControl } from 'mavis-renderer'

import { MProgress, MAlert } from 'mavis-renderer'

import { MListItem, MSeparator } from 'mavis-renderer'

import { MAvatar, MBadge, MSkeleton } from 'mavis-renderer'
import { MTabs } from 'mavis-renderer'
import { MDialog } from 'mavis-renderer'
import { MToast, useToast } from 'mavis-renderer'
const toast = useToast()
const appToast = useToast({ scope: 'app' })
appToast.clear()
// @ts-expect-error: unknown queue lifetime
useToast({ scope: 'global' })
import {
  MSheet,
  MSelect,
  MButton,
  MInput,
  MSlider,
  MSwitch,
  MCheckbox,
  MRadioGroup,
} from 'mavis-renderer'

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
import {
  MDatePicker,
  MDateRangePicker,
  MCombobox,
  MFilePicker,
  MFormGroup,
  MFormErrors,
  MSteps,
  MPagination,
  useFileSelection,
  useFormController,
  useFormField,
} from 'mavis-renderer'
import type { CivilDate, DateRange, ChoiceValue, ComboboxSearch } from '@getcortexlabs/mavis-core'
const civil = ref<CivilDate | null>('2026-11-12')
const interval = ref<DateRange>({ start: null, end: null })
const city = ref<ChoiceValue | null>(null)
const query = ref('')
const find: ComboboxSearch = async (_query, context) => {
  context.onCancel(() => {})
  return [{ value: 'recife', label: 'Recife' }]
}
const files = useFileSelection({ accept: ['image/*'], maxCount: 2 })
const form = useFormController()
useFormField(form, { name: 'date', label: 'Date', target: () => civilInput.value })
const civilInput = ref<InstanceType<typeof MDatePicker>>()
const intervalInput = ref<InstanceType<typeof MDateRangePicker>>()
const cityInput = ref<InstanceType<typeof MCombobox>>()
const fileInput = ref<InstanceType<typeof MFilePicker>>()
const inferredFile = useTemplateRef('inferredFile')
const globalFile = useTemplateRef('globalFile')
civilInput.value?.focus()
intervalInput.value?.blur()
cityInput.value?.focus()
fileInput.value?.focus()
fileInput.value?.blur()
inferredFile.value?.focus()
inferredFile.value?.blur()
globalFile.value?.focus()
globalFile.value?.blur()
// @ts-expect-error: the portable handle does not expose the platform selector
fileInput.value?.picker
</script>

<template>
  <MAppBar title="Collections" :navigateBack="async () => {}" back />
  <MTabBar
    label="Destinations"
    :items="[{ value: 'saved', label: 'Saved', href: '/saved', navigate: async () => {} }]"
  />
  <MPopover label="Details" triggerLabel="Details"
    ><template #default="{ close }"><MButton text="Done" @click="close" /></template
  ></MPopover>
  <MMenu label="Actions" triggerLabel="Actions" :items="[{ value: 1, label: 'Edit' }]" />
  <MTimePicker ref="timeControl" v-model="timeValue" label="Time" :minuteStep="15" />
  <MVirtualList
    :items="collectionItems"
    :itemKey="(item) => item.id"
    :height="280"
    :rowHeight="56"
    label="Items"
    ><template #default="{ item }"
      ><MText :text="item.id.toFixed() + item.title.toUpperCase()" /></template
  ></MVirtualList>

  <MGrid :columns="3" :minColumnWidth="180" gap="md"><MText>Grid</MText></MGrid>
  <m-grid :columns="2" gap="sm" />
  <!-- @vue-expect-error: columns must be a number -->
  <MGrid columns="3" />
  <MImage
    src="/small.jpg"
    alt="Responsive"
    srcset="/small.jpg 320w, /large.jpg 960w"
    sizes="50vw"
    loading="lazy"
    decoding="async"
    fetchpriority="low"
  />
  <!-- @vue-expect-error: loading preserves its union -->
  <MImage src="/image.jpg" alt="Invalid" loading="deferred" />
  <MDatePicker label="Localized" dateFormat="locale" locale="pt-BR" />
  <!-- @vue-expect-error: arbitrary date tokens are unsupported -->
  <MDatePicker label="Invalid format" dateFormat="dd-MM-yy" />
  <MSheet title="Return" returnFocus="trigger" />
  <MSheet title="Application focus" :returnFocus="false" />
  <MFormErrors :form="form" />
  <MFormGroup label="Gathering">
    <MDatePicker ref="civilInput" v-model="civil" label="Day" />
    <MDateRangePicker ref="intervalInput" v-model="interval" label="Period" />
    <MCombobox ref="cityInput" v-model="city" v-model:query="query" :search="find" label="City" />
    <MFilePicker ref="fileInput" :selection="files" label="Attachments" />
    <MFilePicker ref="inferredFile" :selection="files" label="More attachments" />
    <m-file-picker ref="globalFile" :selection="files" label="Global attachments" />
  </MFormGroup>
  <MSteps modelValue="details" :steps="[{ value: 'details', label: 'Details' }]" label="Steps" />
  <MPagination :total="101" :pageSize="20" />
  <MButton :motionSurface="motionSurface">Shared motion</MButton>
  <MCard :motionSurface="cardSurface" />
  <MButton text="Branded"
    ><template #leading><MBadge text="S" /></template
    ><template #trailing><MText>New</MText></template></MButton
  >
  <m-button text="Global"
    ><template #leading><m-badge text="G" /></template
  ></m-button>
  <MTabs :tabs="[{ value: 'one', label: 'One' }]" modelValue="one" label="Retained" keepAlive />
  <m-tabs
    :tabs="[{ value: 'one', label: 'One' }]"
    modelValue="one"
    label="Global retained"
    keepAlive
  />
  <MThemeProvider :theme="mavis" :darkTheme="midnight" appearance="system">
    <MText weight="500">One <MSpan emphasis="strong" tone="primary">word</MSpan>.</MText>
    <MCard elevation="sm" />
  </MThemeProvider>
  <m-theme-provider :theme="mavis"
    ><m-text><m-span emphasis="em">Global</m-span></m-text></m-theme-provider
  >
  <!-- @vue-expect-error: weight is a portable named weight -->
  <MText weight="heavy" />
  <!-- @vue-expect-error: spans do not accept HTML tags -->
  <m-span emphasis="mark" />
  <!-- @vue-expect-error: appearance preserves the mode union -->
  <MThemeProvider appearance="sepia" />
  <!-- @vue-expect-error: global scope uses the same mode union -->
  <m-theme-provider appearance="sepia" />
  <!-- @vue-expect-error: elevation uses theme levels -->
  <MCard elevation="high" />

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

  <MAvatar name="Marina Costa" size="xl" shape="square" />
  <m-avatar name="Mavis" :accessibilityHidden="true" />
  <MBadge :text="0" tone="accent" />
  <m-badge text="New" size="sm" />
  <!-- @vue-expect-error: fixed avatar size tokens -->
  <MAvatar :size="45" />
  <!-- @vue-expect-error: badge content is required -->
  <MBadge />
  <!-- @vue-expect-error: badge tone is semantic -->
  <m-badge text="Wrong" tone="pink" />
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
