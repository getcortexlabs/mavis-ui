<script setup lang="ts">
import { reactive } from 'vue'
import type { InputAction } from './types'

const state = reactive({
  search: 'Mavis' as string,
  url: 'https://mavis-ui.getcortexlabs.com/' as string,
  phone: '+55 11 99999-1234' as string,
  actions: 0 as number,
  locked: true as boolean,
  get action(): InputAction {
    return { icon: 'x', label: 'Clear search', disabled: state.locked }
  },
  clear(): void {
    state.search = ''
    state.actions += 1
  },
})
</script>

<template>
  <MColumn gap="md" width="100%">
    <MInput
      id="search"
      label="Search"
      type="search"
      :modelValue="state.search"
      @update:modelValue="(value) => (state.search = value)"
      :width="320"
      :trailingAction="state.action"
      @action="() => state.clear()"
    />
    <MInput
      label="Website"
      type="url"
      :modelValue="state.url"
      @update:modelValue="(value) => (state.url = value)"
      :width="320"
    />
    <MInput
      label="Phone"
      type="tel"
      :modelValue="state.phone"
      @update:modelValue="(value) => (state.phone = value)"
      :width="320"
    />
    <MButton text="Unlock action" @click="() => (state.locked = false)" />
    <MText>{{ `Actions ${state.actions}; query "${state.search}"` }}</MText>
  </MColumn>
</template>
