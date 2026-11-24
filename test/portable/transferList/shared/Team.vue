<script setup lang="ts">
import { reactive } from 'vue'
import type { SelectOption } from './types'

const state = reactive({
  team: ['ana'] as (string | number)[],
  people: [
    { value: 'ana', label: 'Ana', helperText: undefined, disabled: undefined },
    { value: 'bia', label: 'Bia', helperText: undefined, disabled: undefined },
    { value: 'caio', label: 'Caio', helperText: undefined, disabled: undefined },
    { value: 'duda', label: 'Duda', disabled: true, helperText: undefined },
  ] as SelectOption[],
  locked: false as boolean,
  get summary(): string {
    return state.team.length === 0 ? 'Nobody yet' : `On the team: ${state.team.join(', ')}`
  },
  choose(value: (string | number)[]): void {
    if (value.length <= 3) {
      state.team = value
    }
  },
})
</script>

<template>
  <MColumn gap="md">
    <MTransferList
      id="team"
      label="Team"
      :options="state.people"
      :modelValue="state.team"
      @update:modelValue="(choices) => ((value) => state.choose(value))(choices)"
      :disabled="state.locked"
      availableLabel="People"
      selectedLabel="Team members"
      addLabel="Add to team"
      removeLabel="Take off team"
      emptyLabel="Nobody here"
    />
    <MText id="summary">{{ state.summary }}</MText>
    <MButton
      id="lock"
      :text="state.locked ? 'Unlock' : 'Lock'"
      variant="ghost"
      @click="() => (state.locked = !state.locked)"
    />
  </MColumn>
</template>
