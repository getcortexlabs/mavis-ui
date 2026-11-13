<script setup lang="ts">
import { ref } from 'vue'
import type { TourStep } from '@getcortexlabs/mavis-core'
const step = ref<string | null>(null)
const reason = ref('none')
const missing = ref('none')
const showEnd = ref(true)
const steps = ref<TourStep[]>([
  { id: 'first', title: 'Meet Mavis', description: 'One shared screen.' },
  { id: 'absent', title: 'Unavailable', description: 'This feature is off.' },
  { id: 'last', title: 'Ready to build', description: 'Keep your state.' },
])
</script>
<template>
  <MColumn gap="md" padding="lg">
    <MButton text="Start guide" @click="() => (step = 'first')" />
    <MButton text="Remove last target" @click="() => (showEnd = false)" />
    <MTour
      label="Getting started"
      :steps="steps"
      v-model="step"
      @finish="(next) => (reason = next)"
      @missing="(name) => (missing = name)"
    >
      <MTourTarget name="first" v-slot="{ active }"
        ><MText>{{ active ? 'First active' : 'First idle' }}</MText></MTourTarget
      >
      <MTourTarget v-if="showEnd" name="last"><MText>Last target</MText></MTourTarget>
    </MTour>
    <MText>Step: {{ step ?? 'none' }}</MText>
    <MText>Finished: {{ reason }}</MText>
    <MText>Missing: {{ missing }}</MText>
  </MColumn>
</template>
