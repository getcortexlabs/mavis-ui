<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  name: '' as string,
  wide: false as boolean,
})
</script>

<template>
  <MScreen id="field-screen">
    <MColumn padding="lg" gap="sm">
      <MText>Return switches the width</MText>
      <MColumn id="field-box" :width="state.wide ? 340 : 240">
        <MStack id="field-stack" gap="sm" :responsive="[{ at: 300, direction: 'row' }]">
          <MColumn id="field-input" :grow="1">
            <MInput
              label="Name"
              :modelValue="state.name"
              @update:modelValue="(value) => (state.name = value)"
              @submit="() => (state.wide = !state.wide)"
            />
          </MColumn>
          <MText id="field-width">{{ state.wide ? 'Wide' : 'Narrow' }}</MText>
        </MStack>
      </MColumn>
    </MColumn>
  </MScreen>
</template>
