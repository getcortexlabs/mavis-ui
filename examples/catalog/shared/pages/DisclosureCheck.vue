<script setup lang="ts">
import { ref } from 'vue'
import type { AccordionItem, ChoiceValue, SegmentedOption } from '@getcortexlabs/mavis-core'
const expanded = ref<ChoiceValue[]>([0])
const selected = ref<ChoiceValue | null>(0)
const accept = ref(true)
const multiple = ref(false)
const disabled = ref(false)
const items = ref<AccordionItem[]>([
  { value: 0, title: 'Number zero' },
  { value: '0', title: 'String zero' },
  { value: 'off', title: 'Unavailable', disabled: true },
  { value: 'last', title: 'Last section' },
])
const options = ref<SegmentedOption[]>(
  items.value.map((item) => ({ value: item.value, label: item.title, disabled: item.disabled })),
)
const note = ref('')
function remove() {
  items.value = items.value.filter((item) => item.value !== 0)
  options.value = options.value.filter((item) => item.value !== 0)
}
function toggleMultiple(value: boolean) {
  if (!value) expanded.value = expanded.value.slice(0, 1)
  multiple.value = value
}
function reverse() {
  items.value = [...items.value].reverse()
  options.value = [...options.value].reverse()
}
function clear() {
  selected.value = null
  expanded.value = []
}
</script>
<template>
  <m-screen scroll
    ><m-column padding="lg" gap="md">
      <m-segmented-control
        :options="options"
        :modelValue="selected"
        :disabled="disabled"
        label="Test segments"
        @update:modelValue="
          (value) => {
            if (accept) selected = value
          }
        "
      />
      <m-text id="selection">{{ typeof selected }}:{{ selected }}</m-text>
      <m-accordion
        :items="items"
        :modelValue="expanded"
        :multiple="multiple"
        :disabled="disabled"
        label="Test sections"
        @update:modelValue="
          (value) => {
            if (accept) expanded = value
          }
        "
      >
        <template #default="{ item }"
          ><m-column gap="sm"
            ><m-text>{{ typeof item.value }} body {{ item.value }}</m-text
            ><m-input v-model="note" :label="`Note ${typeof item.value} ${item.value}`" /><m-button
              @click="expanded = []"
              >Close inside</m-button
            ><m-button @click="remove">Remove number inside</m-button></m-column
          ></template
        >
      </m-accordion>
      <m-switch v-model="accept" label="Accept requests" />
      <m-switch
        :modelValue="multiple"
        label="Multiple sections"
        @update:modelValue="toggleMultiple"
      />
      <m-switch v-model="disabled" label="Disable controls" />
      <m-button @click="remove">Remove number</m-button>
      <m-button @click="reverse">Reverse items</m-button>
      <m-button @click="clear">Clear values</m-button>
    </m-column></m-screen
  >
</template>
