<script setup lang="ts">
import { ref } from 'vue'
import {
  seedNames,
  seedBox,
  seedGroup,
  moduleValues,
  type OwnershipBox,
  type OwnershipGroup,
} from './values'
const names = ref([...seedNames])
const first = ref<OwnershipBox>({ ...seedBox })
const second = ref<OwnershipBox>({ ...seedBox })
const group = ref<OwnershipGroup>({ names: [...seedGroup.names] })
const previous = ref<OwnershipGroup>({ names: [] })
const observed = ref(moduleValues())
function change() {
  second.value = { ...first.value }
  first.value.count++
  names.value.push('b')
  previous.value = { ...group.value, names: [...group.value.names] }
  group.value.names.push('b')
  observed.value = moduleValues()
}
</script>

<template>
  <MColumn>
    <MText>{{ `Names ${names.join(',')}` }}</MText>
    <MText>{{ `Records ${first.count}/${second.count}` }}</MText>
    <MText>{{ `Nested ${group.names.join(',')}/${previous.names.join(',')}` }}</MText>
    <MText>{{ `Module ${observed}` }}</MText>
    <MButton @click="change">Edit copies</MButton>
  </MColumn>
</template>
