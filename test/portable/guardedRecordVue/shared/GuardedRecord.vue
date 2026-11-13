<script setup lang="ts">
import { computed, ref } from 'vue'
type Place = { id: string; name: string }
const places = ref<Place[]>([{ id: 'one', name: 'İSTANBUL' }])
const visible = ref(true)
const place = computed(() =>
  places.value.find((item) => item.id === (visible.value ? 'one' : 'missing')),
)
function toggle() {
  visible.value = !visible.value
}
</script>
<template>
  <MColumn>
    <template v-if="place">
      <MText>{{ place.name }}</MText>
      <MText>{{ place.name.toLocaleLowerCase('tr') }}</MText>
      <MText>{{ 'I'.toLocaleLowerCase('tr') }}</MText>
    </template>
    <MText v-else>Missing</MText>
    <MButton text="Toggle place" @click="toggle" />
  </MColumn>
</template>
