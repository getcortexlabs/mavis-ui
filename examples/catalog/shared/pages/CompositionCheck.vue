<script setup lang="ts">
import { ref } from 'vue'
import type { CivilDate, DateRangeDraft } from '@getcortexlabs/mavis-core'
import { useCatalog } from '../context'

const { navigation } = useCatalog()
const text = ref('Keep this draft')
const draft = ref('2026-11-')
const date = ref<CivilDate | null>(null)
const rangeDraft = ref<DateRangeDraft>({ start: '2026-11-', end: '' })
const disabled = ref(false)
const revealed = ref(false),
  extra = ref(false)
const editing = ref('A retained edit')
const mounted = ref(true)
const navigate = async (href: string) => {
  await navigation.push(href)
}
</script>
<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg">
      <m-button id="reveal-toggle" @click="revealed = !revealed">Toggle details</m-button>
      <m-button id="reveal-extra" @click="extra = !extra">Change content height</m-button>
      <m-button id="reveal-mount" @click="mounted = !mounted">Toggle owner</m-button>
      <m-reveal v-if="mounted" id="reveal-panel" :show="revealed" padding="md" gap="md">
        <m-input id="reveal-editor" v-model="editing" label="Retained edit" />
        <m-text v-if="extra"
          >An additional paragraph changes the natural height after opening.</m-text
        >
      </m-reveal>
      <m-button id="scaled-icon-button" icon="plus">A button with an icon</m-button>
      <m-stack
        id="responsive-stack"
        gap="sm"
        :responsive="[
          { at: 600, direction: 'row', gap: 'lg' },
          { at: 1000, gap: 'xl' },
        ]"
      >
        <m-input id="responsive-draft" v-model="text" label="Persistent draft" :grow="1" />
        <m-card :grow="1"><m-text>Same children, different direction.</m-text></m-card>
      </m-stack>
      <m-date-picker
        id="restored-draft"
        v-model="date"
        v-model:draft="draft"
        label="Restored date"
        initialMonth="2026-11"
      />
      <m-date-range-picker
        id="restored-range"
        v-model:draft="rangeDraft"
        label="Restored range"
        initialMonth="2026-11"
      />
      <m-button id="external-draft" @click="draft = '2027-02-'">Restore another draft</m-button>
      <m-button @click="disabled = !disabled">Toggle navigation</m-button>
      <m-button href="/showcase" :navigate="navigate" :disabled="disabled"
        >Button navigation</m-button
      >
      <m-card
        href="/showcase"
        :navigate="navigate"
        :disabled="disabled"
        accessibilityLabel="Card navigation"
      >
        <m-text variant="heading">Card navigation</m-text>
        <m-text>A whole surface, one link.</m-text>
      </m-card>
      <m-link href="/showcase" :navigate="navigate" :disabled="disabled">Inline navigation</m-link>
    </m-column>
  </m-screen>
</template>
