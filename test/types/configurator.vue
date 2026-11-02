<script setup lang="ts">
import { ref } from 'vue'
import { MNumberInput, MMultiSelect, MImage } from '@getcortexlabs/mavis-web'
import {
  MNumberInput as NativeNumber,
  MMultiSelect as NativeMulti,
  MImage as NativeImage,
} from '@getcortexlabs/mavis/vue'
import type { ChoiceValue, InputHandle } from '@getcortexlabs/mavis-core'
const value = ref<number | null>(1)
const values = ref<ChoiceValue[]>([])
const web = ref<InstanceType<typeof MNumberInput>>()
const native = ref<InstanceType<typeof NativeNumber>>()
const global = ref<InputHandle>()
web.value?.focus()
native.value?.blur()
const options = [{ value: 'one', label: 'One' }]
</script>
<template>
  <MNumberInput ref="web" v-model="value" label="Quantity" />
  <NativeNumber ref="native" v-model="value" label="Quantity" />
  <m-number-input ref="global" v-model="value" label="Quantity" />
  <MMultiSelect v-model="values" label="Choices" :options="options" />
  <NativeMulti v-model="values" label="Choices" :options="options" />
  <MImage src="/image.png" alt="Art" />
  <NativeImage src="res://art" alt="Art" />
  <!-- @vue-expect-error model must be a number -->
  <MNumberInput modelValue="one" label="Quantity" />
  <!-- @vue-expect-error multi selection requires an array -->
  <MMultiSelect modelValue="one" label="Choices" :options="options" />
  <!-- @vue-expect-error alt is required even for a decorative image -->
  <MImage src="/image.png" />
</template>
