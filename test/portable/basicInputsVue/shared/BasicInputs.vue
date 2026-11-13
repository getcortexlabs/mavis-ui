<script setup lang="ts">
import { ref, computed } from 'vue'
import type { InputAction } from '@getcortexlabs/mavis-core'
const search = ref('Mavis')
const url = ref('https://mavis-ui.getcortexlabs.com/')
const phone = ref('+55 11 99999-1234')
const actions = ref(0)
const locked = ref(true)
const action = computed<InputAction>(() => ({
  icon: 'x',
  label: 'Clear search',
  disabled: locked.value,
}))
function clear() {
  search.value = ''
  actions.value += 1
}
</script>
<template>
  <MColumn gap="md" width="100%">
    <MInput
      id="search"
      label="Search"
      type="search"
      v-model="search"
      :width="320"
      :trailingAction="action"
      @action="clear"
    />
    <MInput label="Website" type="url" v-model="url" :width="320" />
    <MInput label="Phone" type="tel" v-model="phone" :width="320" />
    <MButton text="Unlock action" @click="locked = false" />
    <MText>Actions {{ actions }}; query "{{ search }}"</MText>
  </MColumn>
</template>
