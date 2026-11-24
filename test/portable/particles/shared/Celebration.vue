<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  trigger: 0 as number,
  count: 0 as number,
  disabled: false as boolean,
  active: false as boolean,
  reason: 'None' as string,
})
</script>

<template>
  <MColumn gap="md">
    <MConfetti
      :trigger="state.trigger"
      :disabled="state.disabled"
      :count="20"
      @burst="() => (state.count += 1)"
      @skipped="
        (next) => {
          state.count += 1
          state.reason = next
        }
      "
    >
      <MColumn padding="md">
        <MText>Saved successfully</MText>
        <MButton text="Celebrate" @click="() => (state.trigger += 1)" />
      </MColumn>
    </MConfetti>
    <MParticleField
      :active="state.active"
      :duration="800"
      :lifetime="500"
      :height="120"
      shape="ring"
    >
      <MColumn padding="md">
        <MText>Scoped atmosphere</MText>
      </MColumn>
    </MParticleField>
    <MText>{{ `Requests ${state.count}` }}</MText>
    <MButton
      text="Disable celebrations"
      @click="
        () => {
          state.disabled = true
          state.reason = 'None'
        }
      "
    />
    <MButton
      :text="state.active ? 'Stop atmosphere' : 'Start atmosphere'"
      @click="() => (state.active = !state.active)"
    />
  </MColumn>
</template>
