<script setup lang="ts">
import { reactive } from 'vue'
import type { OwnershipBox, OwnershipGroup } from './types'
import * as mavisValues from './shared/values'

const state = reactive({
  names: [...mavisValues.seedNames] as string[],
  first: { ...mavisValues.seedBox } as OwnershipBox,
  second: { ...mavisValues.seedBox } as OwnershipBox,
  group: { names: [...mavisValues.seedGroup.names] } as OwnershipGroup,
  previous: { names: [] } as OwnershipGroup,
  observed: mavisValues.moduleValues(),
  change(): void {
    state.second = { ...state.first }
    state.first.count += 1
    state.names.push('b')
    state.previous = { ...state.group, names: [...state.group.names] }
    state.group.names.push('b')
    state.observed = mavisValues.moduleValues()
  },
})
</script>

<template>
  <MColumn>
    <MText>{{ `Names ${state.names.join(',')}` }}</MText>
    <MText>{{ `Records ${state.first.count}/${state.second.count}` }}</MText>
    <MText>{{ `Nested ${state.group.names.join(',')}/${state.previous.names.join(',')}` }}</MText>
    <MText>{{ `Module ${state.observed}` }}</MText>
    <MButton text="Edit copies" @click="() => state.change()" />
  </MColumn>
</template>
