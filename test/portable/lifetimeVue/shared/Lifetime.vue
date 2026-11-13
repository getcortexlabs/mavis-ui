<script setup lang="ts">
import { ref } from 'vue'
import { useWork } from './work'
import Working from './Working.vue'
const work = useWork()
const shown = ref(true)
const completed = ref(0)
const disposed = ref(0)
</script>
<template>
  <MColumn gap="md">
    <MText>{{ work.status.value }}</MText>
    <MText>Cancelled {{ work.cancelled.value }}, committed {{ work.committed.value }}</MText>
    <MText>Completed {{ completed }}, disposed {{ disposed }}</MText>
    <MButton text="Hide child" @click="shown = false" />
    <MButton text="Show child" @click="shown = true" />
    <MButton text="Finish pending work" @click="work.finish()" />
    <Working v-if="shown" @complete="completed += 1" @disposed="disposed += 1" />
  </MColumn>
</template>
