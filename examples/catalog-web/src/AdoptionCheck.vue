<script setup lang="ts">
import { nextTick, ref } from 'vue'
import {
  MButton,
  MDatePicker,
  MDateRangePicker,
  MColumn,
  MGrid,
  MImage,
  MInput,
  MScreen,
  MSheet,
  MStack,
  MText,
} from '@getcortexlabs/mavis-web'
import { formatDateTime } from '@getcortexlabs/mavis-web/date-format'
import type { CivilDate, DateRange, SheetCloseReason } from '@getcortexlabs/mavis-core'
const localDate = ref<CivilDate | null>('2026-11-03')
const localRange = ref<DateRange>({ start: '2026-11-30', end: '2026-12-01' })
const dateLocale = ref<'pt-BR' | 'en-US'>('pt-BR')
const dateError = ref(false)
const open = ref(false),
  mounted = ref(true),
  reject = ref(false),
  trigger = ref(true)
const closeCount = ref(0),
  width = ref(680),
  draft = ref(''),
  ordered = ref([1, 2, 3, 4])
const explicit = ref(true),
  alternate = ref(false),
  leaveFocus = ref(false)
const srcset = ref('/checks-image-small.svg 320w, /checks-image-large.svg 960w')
const sizes = ref('320px'),
  imageLoads = ref(0)
const cellDrafts = ref<Record<number, string>>({})
function destination(_reason: SheetCloseReason) {
  if (leaveFocus.value) return null
  return document.getElementById(alternate.value ? 'adoption-alternate' : 'adoption-trigger')
}
async function externalFocus() {
  leaveFocus.value = true
  open.value = false
  await nextTick()
  const element = document.getElementById('adoption-sheet') as HTMLDialogElement | null
  element?.addEventListener(
    'close',
    () => document.getElementById('adoption-destination')?.focus(),
    { once: true },
  )
}
function closeToAlternate() {
  alternate.value = true
  open.value = false
}
function removeTrigger() {
  trigger.value = false
  open.value = false
}
async function reopen() {
  open.value = false
  await nextTick()
  open.value = true
}
</script>
<template>
  <MScreen scroll>
    <MColumn padding="lg" gap="md">
      <MText as="h1">Consumer adoption checks</MText>
      <MDatePicker
        id="adoption-date"
        v-model="localDate"
        label="Data local"
        :locale="dateLocale"
        dateFormat="locale"
        helperText="Digite uma data ou escolha no calendário. Esta ajuda pode ocupar várias linhas."
        :error="
          dateError
            ? 'Uma mensagem de erro suficientemente longa para quebrar em telas menores.'
            : ''
        "
        initialMonth="2026-11"
      />
      <output id="adoption-date-value">{{ localDate }}</output>
      <MDateRangePicker
        id="adoption-range"
        v-model="localRange"
        label="Período"
        locale="pt-BR"
        dateFormat="dd/MM/yyyy"
        helperText="Escolha o início e o fim."
      />
      <output id="adoption-range-value">{{ localRange.start }} / {{ localRange.end }}</output>
      <button @click="dateLocale = dateLocale === 'pt-BR' ? 'en-US' : 'pt-BR'">
        Change date locale
      </button>
      <button @click="dateError = !dateError">Toggle date error</button>
      <output id="adoption-instant">{{
        formatDateTime(new Date('2026-11-03T01:30:00Z'), {
          locale: 'pt-BR',
          timeZone: 'America/Sao_Paulo',
          dateStyle: 'short',
        })
      }}</output>
      <label><input v-model="explicit" type="checkbox" />Explicit return target</label>
      <label><input v-model="reject" type="checkbox" />Reject dismissal</label>
      <MButton
        v-if="trigger"
        id="adoption-trigger"
        text="Open consumer sheet"
        @click="open = true"
      />
      <button id="adoption-alternate">Alternate trigger</button>
      <button id="adoption-destination">Navigation destination</button>
      <output id="adoption-close-count">{{ closeCount }}</output>
      <MSheet
        v-if="mounted"
        id="adoption-sheet"
        :open="open"
        title="Consumer sheet"
        :return-focus="explicit ? destination : undefined"
        @update:open="
          (value) => {
            if (!reject) open = value
          }
        "
        @close="closeCount++"
      >
        <MInput id="adoption-editor" label="Sheet draft" />
        <button @click="open = false">Programmatic close</button>
        <button @click="closeToAlternate">Return to alternate</button>
        <button @click="removeTrigger">Remove trigger and close</button>
        <button @click="externalFocus">Navigate and close</button>
        <button @click="reopen">Interrupt close</button>
        <button @click="mounted = false">Unmount sheet</button>
      </MSheet>
      <button @click="width = width === 680 ? 320 : 680">Resize container</button>
      <button @click="ordered.reverse()">Reverse cells</button>
      <div id="adoption-container" :style="{ width: width + 'px', maxWidth: '100%' }">
        <MStack id="adoption-stack" gap="md" :responsive="{ at: 500, direction: 'row', gap: 'lg' }">
          <MColumn :grow="1"
            ><MText>Variable height changes with direction and width.</MText
            ><MInput id="adoption-stack-draft" v-model="draft" label="Retained stack draft"
          /></MColumn>
          <MText :grow="1"
            >A long label wraps on a narrow column and becomes shorter in a wider row. Resize
            repeatedly while editing.</MText
          >
        </MStack>
        <MGrid id="adoption-grid" :columns="3" :min-column-width="180" gap="md">
          <MInput
            v-for="item in ordered"
            :id="`adoption-cell-${item}`"
            :key="item"
            v-model="cellDrafts[item]"
            :label="`Cell ${item}`"
          />
        </MGrid>
      </div>
      <img
        id="adoption-viewport-reference"
        :src="'/checks-image-viewport-error.svg'"
        :srcset="'/checks-image-viewport-error.svg 320w, /checks-image-viewport-large.svg 960w'"
        sizes="100vw"
        alt="Browser responsive reference"
        width="200"
        height="100"
      />
      <MImage
        id="adoption-viewport-image"
        src="/checks-image-viewport-error.svg"
        srcset="/checks-image-viewport-error.svg 320w, /checks-image-viewport-large.svg 960w"
        sizes="100vw"
        alt="Viewport candidates"
        :width="200"
        :aspectRatio="2"
      />
      <MImage
        id="adoption-image"
        src="/checks-image-small.svg"
        :srcset="srcset"
        :sizes="sizes"
        loading="eager"
        decoding="async"
        fetchpriority="high"
        alt="Responsive sample"
        :aspect-ratio="2"
        @load="imageLoads++"
      />
      <output id="adoption-image-loads">{{ imageLoads }}</output>
      <button @click="sizes = sizes === '320px' ? '960px' : '320px'">Change image size</button>
      <button @click="srcset = '/checks-image-error.svg 320w'">Use missing source</button>
      <button @click="srcset = '/checks-image-small.svg 320w, /checks-image-large.svg 960w'">
        Restore image source
      </button>
    </MColumn>
  </MScreen>
</template>
