<script setup lang="ts">
import { computed, ref } from 'vue'
import { MButton, MColumn, MText, MTransferList } from '#mavis'
import type { ChoiceOption, ChoiceValue } from '#mavis'

const team = ref<ChoiceValue[]>(['ana'])
const people: ChoiceOption[] = [
  { value: 'ana', label: 'Ana' },
  { value: 'bia', label: 'Bia' },
  { value: 'caio', label: 'Caio' },
  { value: 'duda', label: 'Duda', disabled: true },
]
const locked = ref(false)

// The source keeps the team to three people.
function choose(value: ChoiceValue[]) {
  if (value.length <= 3) team.value = value
}

const summary = computed(() =>
  team.value.length === 0 ? 'Nobody yet' : `On the team: ${team.value.join(', ')}`,
)
</script>

<template>
  <MColumn gap="md">
    <MTransferList
      id="team"
      label="Team"
      :options="people"
      :model-value="team"
      :disabled="locked"
      available-label="People"
      selected-label="Team members"
      add-label="Add to team"
      remove-label="Take off team"
      empty-label="Nobody here"
      @update:model-value="choose"
    />
    <MText id="summary">{{ summary }}</MText>
    <MButton
      id="lock"
      :text="locked ? 'Unlock' : 'Lock'"
      variant="ghost"
      @click="locked = !locked"
    />
  </MColumn>
</template>
