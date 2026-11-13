<script setup lang="ts">
import { computed, ref } from 'vue'
import { MButton, MColumn, MMultiSelect, MText } from '#mavis'
import type { ChoiceOption, ChoiceValue } from '#mavis'

const guests = ref<ChoiceValue[]>(['ana'])
const people: ChoiceOption[] = [
  { value: 'ana', label: 'Ana' },
  { value: 'bia', label: 'Bia' },
  { value: 'caio', label: 'Caio' },
  { value: 'duda', label: 'Duda', disabled: true },
]
const locked = ref(false)
const summary = computed(() =>
  guests.value.length === 0 ? 'Nobody invited' : `Invited: ${guests.value.join(', ')}`,
)
</script>

<template>
  <MColumn gap="md">
    <MMultiSelect
      id="guests"
      v-model="guests"
      label="Guests"
      :options="people"
      :max-selected="2"
      placeholder="Choose guests"
      helper-text="Up to two people"
      :disabled="locked"
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
