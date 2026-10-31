<script setup lang="ts">
import { ref } from 'vue'
const checked = ref(true)
const mixed = ref(true)
const requests = ref(0)
const clears = ref(0)
function setState(value: boolean) {
  checked.value = value
  mixed.value = value
}
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg">
      <m-text as="h1" variant="heading">Checkbox contract</m-text>
      <m-checkbox
        :modelValue="checked"
        :indeterminate="mixed"
        label="Parent keeps its state"
        helperText="Changes are counted but not accepted."
        @update:modelValue="requests++"
        @update:indeterminate="clears++"
      />
      <m-text>{{ `Requests: ${requests}; clears: ${clears}` }}</m-text>
      <m-button @click="setState(false)">Set unchecked</m-button>
      <m-button @click="setState(true)">Set checked and mixed</m-button>
      <m-checkbox v-model="checked" v-model:indeterminate="mixed" label="Parent accepts changes" />
    </m-column>
  </m-screen>
</template>
