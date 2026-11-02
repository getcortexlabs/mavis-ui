<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useState } from '#imports'
import {
  MNumberInput,
  MMultiSelect,
  MImage,
  MAccordion,
  MInput,
  MCheckbox,
} from '@getcortexlabs/mavis-web'
import type { ChoiceValue } from '@getcortexlabs/mavis-core'
const route = useRoute()
const owner = useState('configurator:owner', () => String(route.query.owner || 'Studio'))
const quantity = ref<number | null>(2)
const draft = ref('2')
const selected = ref<ChoiceValue[]>([1])
const panels = ref<ChoiceValue[]>(['details'])
const checked = ref(false)
const note = ref('')
const ready = ref(false)
onMounted(() => {
  ready.value = true
})
</script>
<template>
  <main :data-configurator-ready="ready">
    <h1>{{ owner }} configurator</h1>
    <MNumberInput
      id="nuxt-quantity"
      v-model="quantity"
      v-model:draft="draft"
      label="Quantity"
      :min="0"
      :max="10"
      :step="0.5"
    />
    <output data-testid="quantity-model">{{ quantity }} / {{ draft }}</output>
    <MMultiSelect
      label="Extras"
      v-model="selected"
      :options="[
        { value: 1, label: 'Frame' },
        { value: '1', label: 'Gift wrap' },
      ]"
    />
    <MImage
      id="nuxt-product"
      src="/portrait.svg"
      :alt="`${owner} art print`"
      :width="240"
      :aspectRatio="2"
    />
    <MCheckbox v-model="checked" label="Gift" />
    <MAccordion label="Details" v-model="panels" :items="[{ value: 'details', title: 'Delivery' }]">
      <MInput v-model="note" label="Note" />
    </MAccordion>
  </main>
</template>
