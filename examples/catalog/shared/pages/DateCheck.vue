<script setup lang="ts">
import { ref } from 'vue'
import type { CivilDate, DateRange } from '@getcortexlabs/mavis-core'
const single = ref<CivilDate | null>('2024-02-29')
const range = ref<DateRange>({ start: '2024-03-09', end: '2024-03-09' })
const max = ref<CivilDate>('2025-03-31')
const disabled = ref(false)
const readonly = ref(false)
const locale = ref<'en-US' | 'pt-BR'>('en-US')
const requests = ref(0)
const visible = ref(true)
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="md">
      <m-date-picker
        v-if="visible"
        id="single-date"
        v-model="single"
        label="Departure"
        min="2024-02-01"
        :max="max"
        :disabled="disabled"
        :readonly="readonly"
        :locale="locale"
        :firstDayOfWeek="1"
        helperText="Use the civil date shown on your ticket."
        initialMonth="2024-02"
      />
      <m-text :text="`Single: ${single ?? 'empty'}`" />
      <m-date-range-picker
        id="travel-range"
        v-model="range"
        label="Journey"
        min="2024-03-01"
        max="2024-12-31"
        :unavailableDates="['2024-03-10']"
        initialMonth="2024-03"
      />
      <m-text :text="`Range: ${range.start ?? 'empty'} / ${range.end ?? 'empty'}`" />
      <m-date-picker
        id="rejected-date"
        modelValue="2024-02-01"
        label="Parent rejects"
        @update:modelValue="requests++"
      />
      <m-text :text="`Requests: ${requests}`" />
      <m-date-picker id="empty-date" label="Empty date" initialMonth="2000-01" />
      <m-row wrap gap="sm">
        <m-button id="date-bound" @click="max = '2024-02-20'">Tighten bounds</m-button>
        <m-button id="date-disable" @click="disabled = !disabled">Toggle disabled</m-button>
        <m-button id="date-readonly" @click="readonly = !readonly">Toggle readonly</m-button>
        <m-button id="date-locale" @click="locale = locale === 'en-US' ? 'pt-BR' : 'en-US'"
          >Change locale</m-button
        >
        <m-button id="date-external" @click="single = '2024-02-14'">External date</m-button>
        <m-button id="date-unmount" @click="visible = !visible">Toggle date field</m-button>
      </m-row>
    </m-column>
  </m-screen>
</template>
