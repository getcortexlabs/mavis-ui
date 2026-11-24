<script setup lang="ts">
import { reactive } from 'vue'
import type { Place } from './types'

const state = reactive({
  places: [{ id: 'one', name: 'İSTANBUL' }] as Place[],
  visible: true as boolean,
  get place(): Place | undefined {
    return state.places.find((item) => item.id === (state.visible ? 'one' : 'missing'))
  },
  toggle(): void {
    state.visible = !state.visible
  },
})
</script>

<template>
  <MColumn>
    <template v-if="state.place !== undefined">
      <MText>{{ state.place.name }}</MText>
      <MText>{{ state.place.name.toLocaleLowerCase('tr') }}</MText>
      <MText>{{ 'I'.toLocaleLowerCase('tr') }}</MText>
    </template>
    <template v-else>
      <MText>Missing</MText>
    </template>
    <MButton text="Toggle place" @click="() => state.toggle()" />
  </MColumn>
</template>
