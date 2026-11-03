<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { MDatePicker, MDateRangePicker, MColumn } from '@getcortexlabs/mavis-web'
import { formatDateTime } from '@getcortexlabs/mavis-web/date-format'
import type { CivilDate, DateRange } from '@getcortexlabs/mavis-core'
const ready = ref(false)
const restoredDraft = ref('2024-02-')
const localized = ref<CivilDate | null>('2024-02-29')
const date = ref<CivilDate | null>('2024-02-29')
const draft = ref<CivilDate | null>('2024-02-01')
const range = ref<DateRange>({ start: '2024-03-09', end: '2024-03-11' })
onMounted(() => {
  ready.value = true
})
</script>

<template>
  <main :data-date-ready="ready">
    <h1>Civil dates across hydration</h1>
    <MColumn padding="lg" gap="md">
      <MDatePicker
        id="nuxt-local-date"
        v-model="localized"
        dateFormat="locale"
        locale="pt-BR"
        label="Data localizada"
      />
      <output data-testid="localized-model">{{ localized }}</output>
      <output data-testid="zoned-instant">{{
        formatDateTime(new Date('2026-11-03T01:30:00Z'), {
          locale: 'pt-BR',
          timeZone: 'America/Sao_Paulo',
          dateStyle: 'short',
        })
      }}</output>
      <MDatePicker
        id="nuxt-date"
        v-model="date"
        label="Departure"
        locale="pt-BR"
        initialMonth="2024-02"
        name="departure"
      />
      <MDatePicker id="nuxt-draft" v-model="draft" label="Unfinished date" initialMonth="2024-02" />
      <MDatePicker
        id="nuxt-restored"
        v-model:draft="restoredDraft"
        label="Restored draft"
        initialMonth="2024-02"
      />
      <MDateRangePicker
        id="nuxt-range"
        v-model="range"
        label="Trip"
        initialMonth="2024-03"
        startName="start"
        endName="end"
      />
      <output data-testid="date-model">{{ date }}</output>
      <output data-testid="draft-model">{{ draft }}</output>
      <output data-testid="range-model">{{ range.start }} / {{ range.end }}</output>
    </MColumn>
  </main>
</template>
