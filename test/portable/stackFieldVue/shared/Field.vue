<script setup lang="ts">
import { ref } from 'vue'
import { MColumn, MInput, MScreen, MStack, MText } from '#mavis'

const name = ref('')
const wide = ref(false)
</script>

<template>
  <m-screen id="field-screen">
    <MColumn padding="lg" gap="sm">
      <MText>Return switches the width</MText>
      <MColumn id="field-box" :width="wide ? 340 : 240">
        <MStack id="field-stack" gap="sm" :responsive="{ at: 300, direction: 'row' }">
          <MColumn id="field-input" :grow="1">
            <MInput v-model="name" label="Name" @submit="wide = !wide" />
          </MColumn>
          <MText id="field-width">{{ wide ? 'Wide' : 'Narrow' }}</MText>
        </MStack>
      </MColumn>
    </MColumn>
  </m-screen>
</template>
