<script setup lang="ts">
import { reactive } from 'vue'
import type { TourStep } from './types'

const state = reactive({
  step: undefined as string | undefined,
  reason: 'none' as string,
  missing: 'none' as string,
  showEnd: true as boolean,
  steps: [
    { id: 'first', title: 'Meet Mavis', description: 'One shared screen.' },
    { id: 'absent', title: 'Unavailable', description: 'This feature is off.' },
    { id: 'last', title: 'Ready to build', description: 'Keep your state.' },
  ] as TourStep[],
})
</script>

<template>
  <MColumn gap="md" padding="lg">
    <MButton text="Start guide" @click="() => (state.step = 'first')" />
    <MButton text="Remove last target" @click="() => (state.showEnd = false)" />
    <MTour
      label="Getting started"
      :steps="state.steps"
      :modelValue="state.step ?? null"
      @update:modelValue="(id) => ((value) => (state.step = value))(id ?? undefined)"
      @finish="(next) => (state.reason = next)"
      @missing="(name) => (state.missing = name)"
    >
      <MTourTarget name="first">
        <template #default="{ active }">
          <MText>{{ active ? 'First active' : 'First idle' }}</MText>
        </template>
      </MTourTarget>
      <template v-if="state.showEnd">
        <MTourTarget name="last">
          <MText>Last target</MText>
        </MTourTarget>
      </template>
    </MTour>
    <MText>{{ `Step: ${state.step ?? 'none'}` }}</MText>
    <MText>{{ `Finished: ${state.reason}` }}</MText>
    <MText>{{ `Missing: ${state.missing}` }}</MText>
  </MColumn>
</template>
