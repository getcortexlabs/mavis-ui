<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { MDatePicker, MDateRangePicker } from '@getcortexlabs/mavis-web'
import {
  MDatePicker as NativeDatePicker,
  MDateRangePicker as NativeDateRangePicker,
} from '@getcortexlabs/mavis/vue'
import type {
  CivilDate,
  DateRange,
  DateRangeDraft,
  DateValidation,
  InputHandle,
} from '@getcortexlabs/mavis-core'
const date = ref<CivilDate | null>(null)
const range = ref<DateRange>({ start: null, end: null })
const direct = ref<InstanceType<typeof MDatePicker>>()
const native = ref<InstanceType<typeof NativeDatePicker>>()
const directRange = ref<InstanceType<typeof MDateRangePicker>>()
const nativeRange = ref<InstanceType<typeof NativeDateRangePicker>>()
const globalDate = useTemplateRef('globalDate')
const globalRange = useTemplateRef('globalRange')
const explicit = ref<InputHandle>()
direct.value?.focus()
native.value?.blur()
directRange.value?.focus()
nativeRange.value?.blur()
globalDate.value?.focus()
globalRange.value?.blur()
explicit.value?.focus()
function draft(_value: string) {}
function rangeDraft(_value: DateRangeDraft) {}
function validity(_value: DateValidation) {}
</script>

<template>
  <MDatePicker
    ref="direct"
    v-model="date"
    label="Date"
    locale="pt-BR"
    name="date"
    min="0001-01-01"
    max="9999-12-31"
    :unavailableDates="['2024-02-29']"
    @update:draft="draft"
    @validityChange="validity"
  />
  <NativeDatePicker ref="native" v-model="date" label="Native date" />
  <MDateRangePicker
    ref="directRange"
    v-model="range"
    label="Range"
    startName="start"
    endName="end"
    @update:draft="rangeDraft"
  />
  <NativeDateRangePicker ref="nativeRange" v-model="range" label="Native range" />
  <m-date-picker ref="globalDate" v-model="date" label="Global date" />
  <m-date-range-picker ref="globalRange" v-model="range" label="Global range" />
  <!-- @vue-expect-error dates are civil strings, not JavaScript Date instances -->
  <MDatePicker :modelValue="new Date()" label="Invalid instant" />
  <!-- @vue-expect-error locale support is explicit -->
  <NativeDatePicker label="Unsupported locale" locale="ar-SA" />
  <!-- @vue-expect-error a range has named endpoints -->
  <MDateRangePicker label="Invalid range" :modelValue="['2024-01-01', '2024-01-02']" />
  <!-- @vue-expect-error single dates cannot accept a range -->
  <m-date-picker label="Invalid single value" :modelValue="range" />
</template>
