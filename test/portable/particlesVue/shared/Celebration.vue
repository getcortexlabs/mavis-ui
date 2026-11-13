<script setup lang="ts">
import { ref } from 'vue'
import { MColumn, MConfetti, MParticleField, MText, MButton } from '#mavis'
const trigger = ref(0)
const count = ref(0)
const disabled = ref(false)
const active = ref(false)
const reason = ref('None')
</script>
<template>
  <MColumn gap="md">
    <MConfetti
      :trigger="trigger"
      :disabled="disabled"
      :count="20"
      @burst="count += 1"
      @skipped="
        (next) => {
          count += 1
          reason = next
        }
      "
      ><MColumn padding="md"
        ><MText>Saved successfully</MText
        ><MButton text="Celebrate" @click="trigger += 1" /></MColumn
    ></MConfetti>
    <MParticleField :active="active" :duration="800" :lifetime="500" :height="120" shape="ring"
      ><MColumn padding="md"><MText>Scoped atmosphere</MText></MColumn></MParticleField
    >
    <MText>{{ `Requests ${count}` }}</MText>
    <MButton
      text="Disable celebrations"
      @click="
        () => {
          disabled = true
          reason = 'None'
        }
      "
    />
    <MButton :text="active ? 'Stop atmosphere' : 'Start atmosphere'" @click="active = !active" />
  </MColumn>
</template>
