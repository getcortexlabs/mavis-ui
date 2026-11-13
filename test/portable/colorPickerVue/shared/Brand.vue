<script setup lang="ts">
import { ref } from 'vue'
import { MButton, MColorPicker, MColumn, MText } from '#mavis'

const color = ref('#FF0000')
const colors = ['#f00', 'rgba(0,255,0,.5)', '#00f']
const locked = ref(false)
const quiet = ref(false)

function choose(value: string) {
  if (value !== '#0000FFFF') color.value = value
}
</script>

<template>
  <MColumn gap="md">
    <MColorPicker
      id="brand"
      label="Brand color"
      :model-value="color"
      :palette="colors"
      alpha
      :readonly="locked"
      :animated="!quiet"
      @update:model-value="choose"
    />
    <MText>{{ `Chosen: ${color}` }}</MText>
    <MButton :text="locked ? 'Unlock' : 'Lock'" @click="locked = !locked" />
    <MButton :text="quiet ? 'Animate' : 'Set immediately'" @click="quiet = !quiet" />
  </MColumn>
</template>
